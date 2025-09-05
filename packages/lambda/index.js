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
        await dynamodb.send(
          new PutCommand({
            TableName: tableName,
            Item: { connectionId, roomId: null },
          }),
        );
        return { statusCode: 200 };

      case '$disconnect':
        console.log('Disconnect:', connectionId);
        await dynamodb.send(
          new DeleteCommand({
            TableName: tableName,
            Key: { connectionId },
          }),
        );
        return { statusCode: 200 };

      default:
        console.log('Message from:', connectionId);
        const body = JSON.parse(event.body || '{}');
        const apiGateway = new ApiGatewayManagementApiClient({
          endpoint: `https://${domainName}/${stage}`,
        });

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
