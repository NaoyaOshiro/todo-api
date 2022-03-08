import { TodoType, TodoStatus, TodoStausList, UserType, ErrotMessegeType } from './types';
import { getNextNumber } from './sequences'
import { formatDate, fromatDateNewToDate } from './util';

const AWS = require('aws-sdk')
AWS.config.loadFromPath('./lib/config.json')
const documentClient = new AWS.DynamoDB.DocumentClient()

const TODOS_TABLE_NAME: string = 'todos';
const USERS_TABLE_NAME: string = 'users';
const USERNAME_INDEX_GSI_NAME: string = 'userName-index';
const APIKEY_INDEX_GSI_NAME: string = 'apikey-index';
const USERID_INDEX_GSI_NAME: string = 'userId-index';

// todoを単一取得
export const getTodo = async (todoId: number): Promise<TodoType | null> => {
  const params = {
    TableName: TODOS_TABLE_NAME,
    KeyConditionExpression: 'todoId = :todoId',
    ExpressionAttributeValues: {
      ':todoId': todoId,
    }
  }

  const result: { Items: [TodoType] } = await documentClient.query(params).promise();
  return result.Items[0];
}

// すべてのtodo取得
export const getTodos = async (user: UserType): Promise<[TodoType] | null> => {
  const params = {
    TableName: TODOS_TABLE_NAME,
    IndexName: USERID_INDEX_GSI_NAME,
    KeyConditionExpression: '#userId = :userId',
    ExpressionAttributeNames: {
      '#userId': 'userId'
    },
    ExpressionAttributeValues: {
      ':userId': user.userId
    }
  }

  const resutl: { Items: [TodoType] } = await documentClient.query(params).promise();
  return resutl.Items;
};

// todoを作成
export const createTodo = async (newTodo: TodoType, user: UserType): Promise<TodoType | null> => {
  let nextTodoId = await getNextNumber('todos');

  let todo: TodoType = {
    todoId: nextTodoId ? nextTodoId : 0,
    title: newTodo.title,
    detail: newTodo.detail,
    toDate: fromatDateNewToDate(newTodo.toDate),
    todoStatus: [TodoStatus.Active],
    createdAt: formatDate(new Date()),
    updatedAt: formatDate(new Date()),
    userId: user.userId
  }

  const params = {
    TableName: TODOS_TABLE_NAME,
    Item: {
      'todoId': nextTodoId,
      'title': todo.title,
      'detail': todo.detail,
      'toDate': todo.toDate,
      'todoStatus': todo.todoStatus,
      'createdAt': todo.createdAt,
      'updatedAt': todo.updatedAt,
      'userId': todo.userId
    }
  }

  await documentClient.put(params).promise();
  return todo;
}

// todoを更新
export const updateTodo = async (todo: TodoType, user: UserType): Promise<TodoType | null> => {
  const params = {
    TableName: TODOS_TABLE_NAME,
    Key: {
      todoId: todo.todoId,
      createdAt: todo.createdAt
    },
    UpdateExpression: 'set title = :title, detail=:detail, toDate=:toDate, todoStatus=:todoStatus, updatedAt=:updatedAt',
    ExpressionAttributeValues: {
      ':title': todo.title,
      ':detail': todo.detail,
      ':toDate': fromatDateNewToDate(todo.toDate),
      ':todoStatus': todo.todoStatus,
      ':updatedAt': todo.updatedAt,
    },
    ReturnValues: 'ALL_NEW'
  }

  const resutl: { Attributes: TodoType } = await documentClient.update(params).promise();
  return resutl.Attributes;
}

// todoを削除
export const delteTodo = async (todo: TodoType) => {
  const params = {
    TableName: TODOS_TABLE_NAME,
    Key: {
      todoId: todo.todoId,
      createdAt: todo.createdAt
    },
  }

  const resutl = await documentClient.delete(params).promise();
}

// todoを検索で取得
export const searchTodo = async (searchWord: string, searchTodoStatusIds: TodoStatus[], user: UserType): Promise<TodoType[] | null> => {
  const params = {
    TableName: TODOS_TABLE_NAME,
    FilterExpression: '((contains(title, :searchWord)) OR (contains(detail, :searchWord))) AND userId = :userId',
    ExpressionAttributeValues: {
      ':searchWord': searchWord,
      ':userId': user.userId
    }
  }

  const result: { Items: [TodoType] } = await documentClient.scan(params).promise();

  searchTodoStatusIds = searchTodoStatusIds.map(x => Number(x));

  let todoList: TodoType[] = [];
  let alreadyTodoIndex: number[] = [];
  result.Items.forEach(function (item, index) {
    searchTodoStatusIds.forEach(searchTodoStatusId => {
      if (item.todoStatus!.includes(searchTodoStatusId) && !alreadyTodoIndex.includes(index)) {
        alreadyTodoIndex.push(index);
        todoList.push(item)
      }
    })
  })

  return todoList;
}

// ステータスを取得
export function getStatusList(): TodoStausList {
  let todoStatusList: TodoStausList = [
    { label: '未完了', statusId: 1 },
    { label: '完了', statusId: 2 }
  ]

  return todoStatusList;
}

// userを作成
export const createUser = async (newUser: UserType): Promise<UserType | null | string> => {
  let nextUserId = await getNextNumber('users');

  let user: UserType = {
    userId: nextUserId ? nextUserId : 0,
    userName: newUser.userName,
    password: newUser.password,
    apikey: newUser.userName + newUser.password
  }

  const params = {
    TableName: USERS_TABLE_NAME,
    Item: user
  }

  const resutl = await documentClient.put(params).promise();
  return user;
}

// user検証
export const validateExistingUser = async (userName: string): Promise<ErrotMessegeType | null> => {
  const existingUser = await getUserByUserName(userName);

  let message: ErrotMessegeType = {
    message: ''
  };
  if (existingUser?.length !== 0) {
    message.message = 'ユーザー名「' + userName + '」は使われています。';
  }
  return message;
}

// userを取得(userName)
export const getUserByUserName = async (userName: string): Promise<UserType[] | null> => {
  const params = {
    TableName: USERS_TABLE_NAME,
    IndexName: USERNAME_INDEX_GSI_NAME,
    KeyConditionExpression: '#userName = :userName',
    ExpressionAttributeNames: {
      "#userName": 'userName'
    },
    ExpressionAttributeValues: {
      ':userName': userName
    }
  }

  const resutl = await documentClient.query(params).promise();
  return resutl.Items;
}

// userを取得(userName)
export const signin = async (singinUser: UserType): Promise<UserType | null | ErrotMessegeType> => {
  // export const signinUser = async (singinUser: UserType) => {
  const user = await getUserByUserName(singinUser.userName);

  let errorMessage: ErrotMessegeType = {
    message: 'ユーザー名またはパスワードが違います。'
  };

  if (user!.length === 0) {
    return errorMessage;
  } else if (user![0].password !== singinUser.password) {
    return errorMessage;
  }

  return user![0];
}

// apikeyでuser取得
export const getUserByApikey = async (apikey: string): Promise<UserType | null> => {
  const params = {
    TableName: USERS_TABLE_NAME,
    IndexName: APIKEY_INDEX_GSI_NAME,
    KeyConditionExpression: '#apikey = :apikey',
    ExpressionAttributeNames: {
      '#apikey': 'apikey'
    },
    ExpressionAttributeValues: {
      ':apikey': apikey
    }
  }

  const resutl = await documentClient.query(params).promise();
  if (resutl.Items[0] === undefined) {
    return null;
  } else {
    return resutl.Items[0];
  }
}
