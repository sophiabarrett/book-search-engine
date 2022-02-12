const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");
const { User } = require("../models");

const resolvers = {
  Query: {
    // get a single user by either id or username
    me: async (_, __, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id })
          .select("-__v -password");

        return userData;
      }

      throw new AuthenticationError("Not logged in.");
    },
  },
  Mutation: {
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect credentials.");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials.");
      }

      const token = signToken(user);
      return { token, user };
    },
    addUser: async (_, args) => {
      const user = await User.create(args);
      const token = await signToken(user);
      return { token, user };
    },
    saveBook: async (_, args, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: args.input } },
          { new: true, validators: true }
        );
        return updatedUser;
      }

      throw new AuthenticationError("Must be logged in.");
    },
    removeBook: async (_, { bookId }, { user }) => {
      if (user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: user._id },
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true, validators: true }
        );
        return updatedUser;
      }

      throw new AuthenticationError("Must be logged in.");
    },
  },
};

module.exports = resolvers;
