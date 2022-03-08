import express from 'express'
import {
    UserType,
    TodoType,
    ErrotMessegeType,
    TodoStatus
} from './lib/types';

import {
    getTodos,
    getTodo,
    createTodo,
    updateTodo,
    delteTodo,
    searchTodo,
    getStatusList,
    createUser,
    validateExistingUser,
    signin,
    getUserByApikey,
} from './lib/repository';

import { isArray } from 'util';

const app: express.Express = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*")
    res.header("Access-Control-Allow-Headers", "*");
    next();
})

app.listen(3000);

/**
 * @api {get} /todo/get_todo 単一取得
 * @apiVersion 0.1.0
 * @apiName 単一取得
 * @apiGroup ToDo
 * 
 * @apiHeader {String} apikey APIキー
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "apikey": "user001password"
 *     }
 * 
 * @apiParam {Number} todoId ToDoのID
 * @apiParamExample {json} Request-Example:
 *     {
 *       "todoId": 1
 *     }
 *
 * @apiSuccess {Number} todoId ToDoのID
 * @apiSuccess {String} title タイトル
 * @apiSuccess {String} detail 内容
 * @apiSuccess {String} toDate 期限日
 * @apiSuccess {Numeber[]} todoStatus ステータス(1:未完了、2:完了)
 * @apiSuccess {String} createdAt 作成日
 * @apiSuccess {String} updatedAt 更新日
 * @apiSuccess {Number} userId ユーザーID
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "todoId": 1,
 *       "title": "タイトル1",
 *       "detail": "内容1",
 *       "todoStatus": [1,2],
 *       "createdAt": "2022-03-07 08:00:00",
 *       "updatedAt": "2022-03-07 08:00:00",
 *       "userId": 1
 *     }
 * 
 * @apiError {String} message エラー内容(ユーザー認証エラー、ToDo認証エラー)
 * @apiErrorExample {json} Error-Response(ToDo):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "ToDo authentication error"
 *     }
 * @apiErrorExample {json} Error-Response(User):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "User authentication error"
 *     }
 */
app.get('/api/todo/get_todo', async (req: express.Request, res: express.Response) => {
    try {
        const todoId: number = Number(req.query.id);
        const user = await userAuthentication(req, res);
        if (user) {
            await todoAuthentication(res, todoId, user!);
            const todo = await getTodo(todoId);
            res.json(todo);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

/**
 * @api {get} /todo/get_todos 全取得
 * @apiVersion 0.1.0
 * @apiName 全取得
 * @apiGroup ToDo
 *
 * @apiHeader {String} apikey APIキー
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "apikey": "user001password"
 *     }
 *
 * @apiSuccess {Number} todoId ToDoのID
 * @apiSuccess {String} title タイトル
 * @apiSuccess {String} detail 内容
 * @apiSuccess {String} toDate 期限日
 * @apiSuccess {Numeber[]} todoStatus ステータス(1:未完了、2:完了)
 * @apiSuccess {String} createdAt 作成日
 * @apiSuccess {String} updatedAt 更新日
 * @apiSuccess {Number} userId ユーザーID
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *      [
 *          {
 *            "todoId": 1,
 *            "title": "タイトル1",
 *            "detail": "内容1",
 *            "todoStatus": [1,2],
 *            "createdAt": "2022-03-07 08:00:00",
 *            "updatedAt": "2022-03-07 08:00:00",
 *            "userId": 1
 *          }
 *      ]
 * 
 * @apiError {String} message エラー内容(ユーザー認証エラー)
 * @apiErrorExample {json} Error-Response(User):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "User authentication error"
 *     }
 */
app.get('/api/todo/get_todos', async (req: express.Request, res: express.Response) => {
    try {
        const user = await userAuthentication(req, res);
        if (user) {
            const todos = await getTodos(user);
            res.json(todos);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

/**
 * @api {POST} /todo/create_todo 作成
 * @apiVersion 0.1.0
 * @apiName 作成
 * @apiGroup ToDo
 *
 * @apiHeader {String} apikey APIキー
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "apikey": "user001password"
 *     }
 * 
 * @apiParam {String} title タイトル
 * @apiParam {String} detail 内容
 * @apiParam {String} toDate 期限日
 * @apiParamExample {json} Request-Example:
 *     {
 *       "title": "タイトル1",
 *       "detail": "内容1",
 *       "toDate": "2022-03-07"
 *     }
 *
 * @apiSuccess {Number} todoId ToDoのID
 * @apiSuccess {String} title タイトル
 * @apiSuccess {String} detail 内容
 * @apiSuccess {String} toDate 期限日
 * @apiSuccess {Numeber[]} todoStatus ステータス(1:未完了、2:完了)
 * @apiSuccess {String} createdAt 作成日
 * @apiSuccess {String} updatedAt 更新日
 * @apiSuccess {Number} userId ユーザーID
 * @apiSuccess {String} message 必須項目メッセージ
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "todoId": 1,
 *       "title": "タイトル1",
 *       "detail": "内容1",
 *       "todoStatus": [1],
 *       "createdAt": "2022-03-07 08:00:00",
 *       "updatedAt": "2022-03-07 08:00:00",
 *       "userId": 1
 *     }
 * @apiSuccessExample {json} Success-Response(ValidationMessage):
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "入力項目を確認してください。"
 *     }
 * 
 * @apiError {String} message エラー内容(ユーザー認証エラー)
 * @apiErrorExample {json} Error-Response(User):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "User authentication error"
 *     }
 */
app.post('/api/todo/create_todo', async (req: express.Request, res: express.Response) => {
    try {
        const user = await userAuthentication(req, res);

        if (user) {
            const newTodo: TodoType = req.body;
            const todoValidateResult = todoValidatoin(res, newTodo);

            if (todoValidateResult) {
                const todo = await createTodo(newTodo, user);
                res.json(todo);
            }
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error' });
    }
});

/**
 * @api {PUT} /todo/update_todo 更新
 * @apiVersion 0.1.0
 * @apiName 更新
 * @apiGroup ToDo
 *
 * @apiHeader {String} apikey APIキー
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "apikey": "user001password"
 *     }
 * 
 * @apiParam {String} title タイトル
 * @apiParam {String} detail 内容
 * @apiParam {String} toDate 期限日
 * @apiParam {Numeber[]} todoStatus ステータス(1:未完了、2:完了)
 * @apiParamExample {json} Request-Example:
 *     {
 *       "title": "タイトル1",
 *       "detail": "内容2",
 *       "toDate": "2022-03-07",
 *       "toStatus": [2]
 *     }
 *
 * @apiSuccess {Number} todoId ToDoのID
 * @apiSuccess {String} title タイトル
 * @apiSuccess {String} detail 内容
 * @apiSuccess {String} toDate 期限日
 * @apiSuccess {Numeber[]} todoStatus ステータス(1:未完了、2:完了)
 * @apiSuccess {String} createdAt 作成日
 * @apiSuccess {String} updatedAt 更新日
 * @apiSuccess {Number} userId ユーザーID
 * @apiSuccess {String} message 必須項目メッセージ
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "todoId": 1,
 *       "title": "タイトル1",
 *       "detail": "内容2",
 *       "todoStatus": [2],
 *       "createdAt": "2022-03-07 08:00:00",
 *       "updatedAt": "2022-03-08 08:00:00",
 *       "userId": 1
 *     }
 * @apiSuccessExample {json} Success-Response(ValidationMessage):
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "入力項目を確認してください。"
 *     }
 * 
 * @apiError {String} message エラー内容(ユーザー認証エラー、ToDo認証エラー)
 * @apiErrorExample {json} Error-Response(ToDo):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "ToDo authentication error"
 *     }
 * @apiErrorExample {json} Error-Response(User):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "User authentication error"
 *     }
 */
app.put('/api/todo/update_todo', async (req: express.Request, res: express.Response) => {
    try {
        const user = await userAuthentication(req, res);
        const todo: TodoType = req.body;
        const todoValidateResult = todoValidatoin(res, todo);

        if (user && todoValidateResult) {
            await todoAuthentication(res, todo.todoId!, user!);
            const newTodo = await updateTodo(todo, user);
            res.json(newTodo);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error' });
    }
});

/**
 * @api {DELETE} /todo/delete_todo 削除
 * @apiVersion 0.1.0
 * @apiName 削除
 * @apiGroup ToDo
 *
 * @apiHeader {String} apikey APIキー
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "apikey": "user001password"
 *     }
 * 
 * @apiParam {Number} todoId ToDoのID
 * @apiParamExample {json} Request-Example:
 *     {
 *       "todoId": 1
 *     }
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {}
 * 
 * @apiError {String} message エラー内容(ユーザー認証エラー、ToDo認証エラー)
 * @apiErrorExample {json} Error-Response(ToDo):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "ToDo authentication error"
 *     }
 * @apiErrorExample {json} Error-Response(User):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "User authentication error"
 *     }
 */
app.delete('/api/todo/delete_todo', async (req: express.Request, res: express.Response) => {
    const user = await userAuthentication(req, res);

    if (user) {
        const todoId = Number(req.body.todoId);
        await todoAuthentication(res, todoId!, user!);
        const todo = await getTodo(todoId);

        try {
            await delteTodo(todo!);
            res.json();
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error' });
        }
    }
});

/**
 * @api {GET} /todo/get_todo_search 検索
 * @apiVersion 0.1.0
 * @apiName 検索
 * @apiGroup ToDo
 *
 * @apiHeader {String} apikey APIキー
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "apikey": "user001password"
 *     }
 * 
 * @apiParam {String} searchWord 検索ワード(タイトル、内容)
 * @apiParam {Number[]} searchTodoStatus ステータス(1:未完了、2:完了)
 * @apiParamExample {json} Request-Example:
 *     {
 *       "searchWord": "タイトル1",
 *       "searchTodoStatus": [1]
 *     }
 *
 * @apiSuccess {Number} todoId ToDoのID
 * @apiSuccess {String} title タイトル
 * @apiSuccess {String} detail 内容
 * @apiSuccess {String} toDate 期限日
 * @apiSuccess {Numeber[]} todoStatus ステータス(1:未完了、2:完了)
 * @apiSuccess {String} createdAt 作成日
 * @apiSuccess {String} updatedAt 更新日
 * @apiSuccess {Number} userId ユーザーID
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *      [
 *          {
 *            "todoId": 1,
 *            "title": "タイトル1",
 *            "detail": "内容1",
 *            "todoStatus": [1,2],
 *            "createdAt": "2022-03-07 08:00:00",
 *            "updatedAt": "2022-03-07 08:00:00",
 *            "userId": 1
 *          }
 *      ]
 * 
 * @apiError {String} message エラー内容(ユーザー認証エラー)
 * @apiErrorExample {json} Error-Response(User):
 *     HTTP/1.1 403 Not Found
 *     {
 *       "message": "User authentication error"
 *     }
 */
app.get('/api/todo/get_todo_search', async (req: express.Request, res: express.Response) => {
    try {
        const user = await userAuthentication(req, res);

        if (user) {
            const searchWord = typeof req.query.searchWord === "string" ? req.query.searchWord : '';
            const searchTodoStatusIds = isArray(req.query.searchTodoStatusIds) ? req.query.searchTodoStatusIds : [];
            let resutlSearchTodoStatusIds: number[] = [];
            searchTodoStatusIds.map(searchTodoStatusId => { resutlSearchTodoStatusIds.push(Number(searchTodoStatusId)); });
            const todo = await searchTodo(searchWord, resutlSearchTodoStatusIds, user);
            res.json(todo);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

/**
 * @api {GET} /todo/get_status_list ステータス取得
 * @apiVersion 0.1.0
 * @apiName ステータス取得
 * @apiGroup ToDo
 * @apiDescription ToDoに設定できるステータスを取得できます。
 *
 * @apiSuccess {Number} label ステータス表示名
 * @apiSuccess {Number} statusId ステータスID
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *      [
 *          {
 *            "label": "未完了",
 *            "statusId": 1
 *          },
 *          {
 *            "label": "完了",
 *            "statusId": 2
 *          }
 *      ]
 */
app.get('/api/todo/get_status_list', async (req: express.Request, res: express.Response) => {
    try {
        const todo = await getStatusList();
        res.json(todo);
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

/**
 * @api {post} /user/create_user 作成
 * @apiVersion 0.1.0
 * @apiName 作成
 * @apiGroup User
 *
 * @apiParam {String} userName ユーザー名
 * @apiParam {Strign} password パスワード
 * @apiParamExample {json} Request-Example:
 *     {
 *       "userName": "user001",
 *       "password": "password"
 *     }
 *
 * @apiSuccess {Number} userId ユーザーID
 * @apiSuccess {String} userName ユーザー名
 * @apiSuccess {String} password パスワード
 * @apiSuccess {String} apikey APIキー
 * @apiSuccess {String} message 新規ユーザー作成失敗メッセージ
 * @apiSuccessExample {json} Success-Response(SignupSuccess):
 *     HTTP/1.1 200 OK
 *     {
 *       "userId": 1,
 *       "userName": "user001",
 *       "password": "password",
 *       "apikey": "user001password"
 *     }
 * @apiSuccessExample {json} Success-Response(UserExisting):
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "ユーザー名「{userName}」は使われています。"
 *     }
 */
app.post('/api/user/create_user', async (req: express.Request, res: express.Response) => {
    try {
        const newUser: UserType = req.body;
        const validateResult = await validateExistingUser(newUser.userName);
        if (validateResult?.message !== '') {
            res.json(validateResult);
        } else {
            const user = await createUser(newUser);
            res.json(user);
        }
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

/**
 * @api {post} /user/signin_user ログイン
 * @apiVersion 0.1.0
 * @apiName ログイン
 * @apiGroup User
 *
 * @apiParam {String} userName ユーザー名
 * @apiParam {Strign} password パスワード
 * @apiParamExample {json} Request-Example:
 *     {
 *       "userName": "user001",
 *       "password": "password"
 *     }
 * 
 * @apiSuccess {Number} userId ユーザーID
 * @apiSuccess {String} userName ユーザー名
 * @apiSuccess {String} password パスワード
 * @apiSuccess {String} apikey APIキー
 * @apiSuccess {String} message ログイン失敗メッセージ
 * @apiSuccessExample {json} Success-Response(SigninSuccess):
 *     HTTP/1.1 200 OK
 *     {
 *       "userId": 1,
 *       "userName": "user001",
 *       "password": "password",
 *       "apikey": "user001password"
 *     }
 * @apiSuccessExample {json} Success-Response(UserNotFound):
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "ユーザー名またはパスワードが違います。"
 *     }
 */
app.post('/api/user/signin_user', async (req: express.Request, res: express.Response) => {
    try {
        const singinUser: UserType = req.body;
        const result = await signin(singinUser);
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Error' });
    }
});

// user認証
async function userAuthentication(req: express.Request, res: express.Response): Promise<UserType | null> {
    const apikey = req.headers.apikey;
    const message: ErrotMessegeType = {
        message: 'User authentication error'
    }
    if (typeof apikey === 'string') {
        const authResult = await getUserByApikey(apikey);
        if (authResult === null) {
            res.status(403).json(message);
        } else {
            return authResult;
        }
    } else {
        res.status(403).json(message);
    }
    return null;
}

// todo認証
async function todoAuthentication(res: express.Response, todoId: number, user: UserType): Promise<TodoType | null> {
    const todo = await getTodo(todoId);

    if (todo?.userId !== user.userId) {
        const message: ErrotMessegeType = {
            message: 'ToDo authentication error'
        }
        res.status(403).json(message);
    } else {
        return todo;
    }
    return null;
}

// todo検証
function todoValidatoin(res: express.Response, todo: TodoType): boolean {
    if (!todo.title || !todo.detail || !todo.toDate) {
        const message: ErrotMessegeType = {
            message: '入力項目を確認してください。'
        }
        res.status(200).json(message);
        return false;
    }
    return true;
}
