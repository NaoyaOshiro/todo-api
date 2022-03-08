const AWS = require('aws-sdk')
AWS.config.loadFromPath('./lib/config.json')
const documentClient = new AWS.DynamoDB.DocumentClient()

export const getNextNumber = async (tableName: string): Promise<number | null> => {
  const params = {
    TableName: 'sequences',
    Key: {
      tableName: tableName
    },
    AttributeUpdates: {
      'currentNumber': {
        Action: 'ADD',
        Value: 1
      },
    },
    ReturnValues: 'UPDATED_NEW',
  }

  type sequencesJson = {
    Attributes: {
      currentNumber: number
    }
  }

  const resutl: sequencesJson = await documentClient.update(params).promise();

  return resutl.Attributes.currentNumber;
}
