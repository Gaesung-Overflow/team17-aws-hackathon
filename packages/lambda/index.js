const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

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
        await dynamodb.send(new PutCommand({
          TableName: tableName,
          Item: { connectionId }
        }));
        return { statusCode: 200 };

      case '$disconnect':
        console.log('Disconnect:', connectionId);
        await dynamodb.send(new DeleteCommand({
          TableName: tableName,
          Key: { connectionId }
        }));
        return { statusCode: 200 };

      default:
        console.log('Message from:', connectionId);
        const body = JSON.parse(event.body || '{}');
        const result = await dynamodb.send(new ScanCommand({
          TableName: tableName
        }));

        const apiGateway = new ApiGatewayManagementApiClient({
          endpoint: `https://${domainName}/${stage}`
        });

        const promises = result.Items.map(async ({ connectionId: id }) => {
          if (id !== connectionId) {
            try {
              await apiGateway.send(new PostToConnectionCommand({
                ConnectionId: id,
                Data: JSON.stringify(body)
              }));
            } catch (err) {
              console.log('Send error:', err);
              if (err.$metadata?.httpStatusCode === 410) {
                await dynamodb.send(new DeleteCommand({
                  TableName: tableName,
                  Key: { connectionId: id }
                }));
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
