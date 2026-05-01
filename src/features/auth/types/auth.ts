


export type AuthCredentials = {
  username: string
  password: string
}
export type AppRole = 'admin' | 'vendedor'



export type AuthSession = {
  access: string,
  expiresIn: string,
  user: User,
}
export type User = {
  fullName: string,
  id: number,
  role: AppRole,
  permissions: AppRole[],
  username: string
}


