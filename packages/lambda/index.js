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

        // joinRoom으로 방 입장 처리
        if (body.type === 'joinRoom') {
          await dynamodb.send(
            new PutCommand({
              TableName: tableName,
              Item: { connectionId, roomId: body.roomId },
            }),
          );
          console.log(`User ${connectionId} joined room ${body.roomId}`);
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
