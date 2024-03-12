import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getUserData } from '../../utils/Utils';

interface UserState {
  user: any | null;
}

const initialState: UserState = {
  user: getUserData() ? JSON.parse(getUserData()) : null
};

export const userSlice = createSlice({
  name: 'userSlice',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
    },
    setUser: (state, action: PayloadAction<any | null>) => {
      state.user = action.payload;
    }
  }
});

export default userSlice.reducer;

export const { logout, setUser } = userSlice.actions;
