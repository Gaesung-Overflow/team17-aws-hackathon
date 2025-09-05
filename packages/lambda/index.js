const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { connectionId, routeKey, domainName, stage } = event.requestContext;
  const tableName = 'websocket-connections';

  try {
    switch (routeKey) {
      case '$connect':
        console.log('Connect:', connectionId);
        try {
          await dynamodb.send(
            new PutCommand({
              TableName: tableName,
              Item: {
                connectionId,
                roomId: null,
                connectedAt: new Date().toISOString(),
              },
            }),
          );
          console.log('Connection stored successfully');
          return { statusCode: 200 };
        } catch (error) {
          console.error('Connect error:', error);
          return { statusCode: 500 };
        }

      case '$disconnect':
        console.log('Disconnect:', connectionId);
        try {
          await dynamodb.send(
            new DeleteCommand({
              TableName: tableName,
              Key: { connectionId },
            }),
          );
          console.log('Connection removed successfully');
          return { statusCode: 200 };
        } catch (error) {
          console.error('Disconnect error:', error);
          return { statusCode: 500 };
        }

      default:
        console.log('Message from:', connectionId);
        const body = JSON.parse(event.body || '{}');
        const apiGateway = new ApiGatewayManagementApiClient({
          endpoint: `https://${domainName}/${stage}`,
        });

        if (body.type === 'createRoom') {
          await dynamodb.send(
            new PutCommand({
              TableName: tableName,
              Item: {
                connectionId,
                roomId: body.roomId,
                userType: 'host',
                roomName: body.roomName,
              },
            }),
          );

          await apiGateway.send(
            new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: JSON.stringify({
                type: 'roomCreated',
                roomId: body.roomId,
                roomName: body.roomName,
              }),
            }),
          );

          return { statusCode: 200 };
        }

        if (body.type === 'joinGame') {
          await dynamodb.send(
            new PutCommand({
              TableName: tableName,
              Item: {
                connectionId,
                roomId: body.roomId,
                userType: 'player',
                playerId: body.playerId,
                playerName: body.playerName,
              },
            }),
          );

          // 방장에게 새 플레이어 알림
          const roomMembers = await dynamodb.send(
            new ScanCommand({
              TableName: tableName,
              FilterExpression: 'roomId = :roomId AND userType = :userType',
              ExpressionAttributeValues: {
                ':roomId': body.roomId,
                ':userType': 'host',
              },
            }),
          );

          for (const member of roomMembers.Items) {
            try {
              await apiGateway.send(
                new PostToConnectionCommand({
                  ConnectionId: member.connectionId,
                  Data: JSON.stringify({
                    type: 'playerJoined',
                    playerId: body.playerId,
                    playerName: body.playerName,
                  }),
                }),
              );
            } catch (err) {
              console.log('Send error:', err);
            }
          }

          // 플레이어에게 참가 완료 알림
          await apiGateway.send(
            new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: JSON.stringify({
                type: 'joinSuccess',
                playerId: body.playerId,
              }),
            }),
          );

          return { statusCode: 200 };
        }

        if (body.type === 'playerAction') {
          // 현재 플레이어 정보 조회
          const currentUser = await dynamodb.send(
            new ScanCommand({
              TableName: tableName,
              FilterExpression: 'connectionId = :id',
              ExpressionAttributeValues: { ':id': connectionId },
            }),
          );

          const user = currentUser.Items[0];
          if (!user || user.userType !== 'player') {
            return { statusCode: 400 };
          }

          // 같은 방의 방장에게 액션 전달
          const hostMembers = await dynamodb.send(
            new ScanCommand({
              TableName: tableName,
              FilterExpression: 'roomId = :roomId AND userType = :userType',
              ExpressionAttributeValues: {
                ':roomId': user.roomId,
                ':userType': 'host',
              },
            }),
          );

          for (const host of hostMembers.Items) {
            try {
              await apiGateway.send(
                new PostToConnectionCommand({
                  ConnectionId: host.connectionId,
                  Data: JSON.stringify({
                    type: 'playerAction',
                    playerId: user.playerId,
                    action: body.action,
                  }),
                }),
              );
            } catch (err) {
              console.log('Send error:', err);
            }
          }

          return { statusCode: 200 };
        }

        if (body.type === 'joinRoom') {
          await dynamodb.send(
            new PutCommand({
              TableName: tableName,
              Item: { connectionId, roomId: body.roomId },
            }),
          );

          await apiGateway.send(
            new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: JSON.stringify({
                type: 'system',
                message: `방 ${body.roomId}에 입장했습니다`,
              }),
            }),
          );

          return { statusCode: 200 };
        }

        const currentUser = await dynamodb.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: 'connectionId = :id',
            ExpressionAttributeValues: { ':id': connectionId },
          }),
        );

        const userRoomId = currentUser.Items[0]?.roomId;
        if (!userRoomId) {
          return { statusCode: 200 };
        }

        const roomMembers = await dynamodb.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: 'roomId = :roomId',
            ExpressionAttributeValues: { ':roomId': userRoomId },
          }),
        );

        const promises = roomMembers.Items.map(async ({ connectionId: id }) => {
          if (id !== connectionId) {
            try {
              await apiGateway.send(
                new PostToConnectionCommand({
                  ConnectionId: id,
                  Data: JSON.stringify(body),
                }),
              );
            } catch (err) {
              console.log('Send error:', err);
              if (err.$metadata?.httpStatusCode === 410) {
                await dynamodb.send(
                  new DeleteCommand({
                    TableName: tableName,
                    Key: { connectionId: id },
                  }),
                );
              }
            }
          }
        });

        await Promise.all(promises);
        return { statusCode: 200 };
    }
  } catch (error) {
    console.error('Handler error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
