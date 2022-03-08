export type TodoType = {
  todoId?: number
  title: string
  detail: string
  toDate: string
  todoStatus?: TodoStatus[]
  createdAt?: string
  updatedAt?: string
  userId?: number
}

export enum TodoStatus {
  Active = 1,
  Passive = 2
}

export type TodoStausList = {
  label: string
  statusId: number
}[]

export type UserType = {
  userId?: number
  userName: string
  password: string
  apikey?: string
}

export type ErrotMessegeType = {
  message: string
}
