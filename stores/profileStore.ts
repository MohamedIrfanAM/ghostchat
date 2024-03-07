import {create} from 'zustand';

type profile = {
  displayname: string;
  imageurl: string;
};

type profileState = {
  id: string;
  profile: profile;
  setProfile: (profile:profile) => void;
  setId: (id:string) => void;
};

export const useProfileStore = create<profileState>((set) => ({
  id: '',
  profile:{
    displayname: '',
    imageurl: '',
  },
  setProfile: (profile:profile) => set({profile}),
  setId: (id:string) => set({id}),
}));
