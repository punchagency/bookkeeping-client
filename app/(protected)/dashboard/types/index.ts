export interface MxUser {
  _id: string;
  userId: string;
  mxGuid: string;
  createdAt: string;
}

export interface ConnectedBank {
  _id: string;
  userId: string;
  bankName: string;
  accountType: string;
  connectionStatus: string;
  createdAt: string;
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  mxUser: MxUser | null;
}
