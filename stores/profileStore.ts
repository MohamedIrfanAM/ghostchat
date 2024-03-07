import { create } from 'zustand';

type profile = {
  displayname: string;
  imageurl: string;
};

type profileState = {
  id: string;
  profile: profile;
  setProfile: (profile: profile) => void;
  setId: (id: string) => void;
};

type guestState = {
  guestId: string;
  roomId: number;
  setGuestId: (guestId: string) => void;
  setRoomId: (roomId: number) => void;
  profile: profile;
  setProfile: (profile: profile) => void;
};

export const useProfileStore = create<profileState>((set) => ({
  id: '',
  profile: {
    displayname: '',
    imageurl: '',
  },
  setProfile: (profile: profile) => set({ profile }),
  setId: (id: string) => set({ id }),
}));

export const useGuestStore = create<guestState>((set) => ({
  guestId: '',
  roomId: -1,
  setGuestId: (guestId: string) => set({ guestId }),
  setRoomId: (roomId: number) => set({ roomId }),
  profile: {
    displayname: '',
    imageurl: '',
  },
  setProfile: (profile: profile) => set({ profile }),
}));
