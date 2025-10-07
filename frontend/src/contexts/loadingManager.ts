let setLoadingFn: (val: boolean) => void = () => {};

export const loadingManager = {
  setLoading: (val: boolean) => setLoadingFn(val),
  register: (setter: (val: boolean) => void) => {
    setLoadingFn = setter;
  },
};
