module.exports = {
  ApolloServer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    applyMiddleware: jest.fn(),
  })),
};
