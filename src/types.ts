export interface IToken {
  type: string
  value?: any
  start: number
}

export interface IAst {
  type: string
  name?: string
  value?: any
  children?: Array<IAst | undefined | null>
}