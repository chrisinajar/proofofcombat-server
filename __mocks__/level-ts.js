module.exports = jest.fn().mockImplementation(() => {
  const inMemoryDatabase = {};
  return {
    get: jest.fn().mockImplementation(async (key) => inMemoryDatabase[key]),
    put: jest
      .fn()
      .mockImplementation(
        async (key, value) => (inMemoryDatabase[key] = value)
      ),
  };
});
