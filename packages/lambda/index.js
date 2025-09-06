const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
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

        // joinRoom으로 방 입장 처리
        if (body.type === 'joinRoom') {
          await dynamodb.send(
            new UpdateCommand({
              TableName: tableName,
              Key: { connectionId },
              UpdateExpression: 'SET roomId = :roomId',
              ExpressionAttributeValues: { ':roomId': body.roomId },
            }),
          );
          console.log(`User ${connectionId} joined room ${body.roomId}`);
          return { statusCode: 200 };
        }

        // createRoom 처리 - 방장이 방을 생성할 때
        if (body.type === 'createRoom') {
          console.log(`Room ${body.roomId} created by ${connectionId}`);

          // 방장을 방에 입장시킴
          await dynamodb.send(
            new UpdateCommand({
              TableName: tableName,
              Key: { connectionId },
              UpdateExpression: 'SET roomId = :roomId',
              ExpressionAttributeValues: { ':roomId': body.roomId },
            }),
          );
          console.log(`Host ${connectionId} joined room ${body.roomId}`);

          // 방장에게 방 생성 성공 알림
          await apiGateway.send(
            new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: JSON.stringify({
                type: 'roomCreated',
                roomId: body.roomId,
                roomName: body.roomName,
                connectionId,
              }),
            }),
          );
          return { statusCode: 200 };
        }

        // joinGame 처리 - 플레이어가 게임에 참가할 때
        if (body.type === 'joinGame') {
          console.log(`Processing joinGame: ${JSON.stringify(body)}`);

          try {
            // 먼저 방에 입장
            await dynamodb.send(
              new UpdateCommand({
                TableName: tableName,
                Key: { connectionId },
                UpdateExpression: 'SET roomId = :roomId',
                ExpressionAttributeValues: { ':roomId': body.roomId },
              }),
            );
            console.log(`Player ${body.playerName} joined room ${body.roomId}`);

            // 방의 모든 멤버 조회 (새로 입장한 플레이어 포함)
            const roomMembers = await dynamodb.send(
              new ScanCommand({
                TableName: tableName,
                FilterExpression: 'roomId = :roomId',
                ExpressionAttributeValues: { ':roomId': body.roomId },
              }),
            );

            console.log(
              `Found ${roomMembers.Items.length} members in room ${body.roomId}:`,
              roomMembers.Items,
            );

            // 모든 방 멤버에게 joinGameSuccess와 playerJoined 메시지 브로드캐스트
            const successMessage = {
              type: 'joinGameSuccess',
              playerId: body.playerId,
              playerName: body.playerName,
              roomId: body.roomId,
              roomMembers: roomMembers.Items,
              emoji: body.emoji,
            };

            const joinMessage = {
              type: 'playerJoined',
              playerId: body.playerId,
              playerName: body.playerName,
              roomId: body.roomId,
              emoji: body.emoji,
            };

            console.log('Broadcasting messages to all members:', {
              successMessage,
              joinMessage,
            });

            const promises = roomMembers.Items.map(
              async ({ connectionId: id }) => {
                try {
                  console.log(`Sending messages to connection: ${id}`);

                  // joinGameSuccess 전송
                  await apiGateway.send(
                    new PostToConnectionCommand({
                      ConnectionId: id,
                      Data: JSON.stringify(successMessage),
                    }),
                  );

                  // playerJoined 전송
                  await apiGateway.send(
                    new PostToConnectionCommand({
                      ConnectionId: id,
                      Data: JSON.stringify(joinMessage),
                    }),
                  );

                  console.log(`Successfully sent both messages to ${id}`);
                } catch (err) {
                  console.log('Send error to', id, ':', err);
                  if (err.$metadata?.httpStatusCode === 410) {
                    console.log(`Connection ${id} is stale, removing from DB`);
                    await dynamodb.send(
                      new DeleteCommand({
                        TableName: tableName,
                        Key: { connectionId: id },
                      }),
                    );
                  }
                }
              },
            );

            await Promise.all(promises);
            return { statusCode: 200 };
          } catch (error) {
            console.error('joinGame error:', error);

            // 에러 발생 시 클라이언트에게 알림
            try {
              await apiGateway.send(
                new PostToConnectionCommand({
                  ConnectionId: connectionId,
                  Data: JSON.stringify({
                    type: 'joinGameError',
                    error: error.message,
                  }),
                }),
              );
            } catch (sendError) {
              console.error('Failed to send error message:', sendError);
            }

            return { statusCode: 500 };
          }
        }

        // 현재 사용자의 방 정보 조회
        const currentUser = await dynamodb.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: 'connectionId = :id',
            ExpressionAttributeValues: { ':id': connectionId },
          }),
        );

        const userRoomId = currentUser.Items[0]?.roomId;
        if (!userRoomId) {
          console.log(`User ${connectionId} not in any room`);
          return { statusCode: 200 };
        }

        console.log(`Broadcasting message to room ${userRoomId}:`, body);

        // 같은 방의 모든 사용자에게 메시지 브로드캐스트
        const roomMembers = await dynamodb.send(
          new ScanCommand({
            TableName: tableName,
            FilterExpression: 'roomId = :roomId',
            ExpressionAttributeValues: { ':roomId': userRoomId },
          }),
        );

        const promises = roomMembers.Items.map(async ({ connectionId: id }) => {
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
        });

        await Promise.all(promises);
        return { statusCode: 200 };
    }
  } catch (error) {
    console.error('Handler error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
