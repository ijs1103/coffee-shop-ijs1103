require("dotenv").config();
import http from "http";
import { graphqlUploadExpress } from "graphql-upload";
import express from "express";
import logger from "morgan";
import { ApolloServer } from "apollo-server-express";
import { typeDefs, resolvers} from "./schema";
import { getUser } from "./users/users.utils";

  const PORT = process.env.PORT;

  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    uploads: false,
    playground: true,
    introspection: true,
    context: async (ctx) => {
      if(ctx.req){
        return{
          loggedInUser: await getUser(ctx.req.headers.token),
        };
      } else{
        const{ connection: { context }} = ctx;
        return{
          loggedInUser: context.loggedInUser,
        };
      }
    },
    subscriptions: {
      onConnect: async ({ token }) => {
        if(!token) {
          throw new Error("You can't access");
        }
        const loggedInUser =  await getUser(token);
        return {
          loggedInUser,
        };
      },
    },
  });

  const app = express();
  app.use(graphqlUploadExpress());
  app.use(logger("tiny"));
  apollo.applyMiddleware({ app });
  app.use("/static", express.static("uploads"));
  const httpServer = http.createServer(app);
  apollo.installSubscriptionHandlers(httpServer);
  httpServer.listen({port: PORT}, () => {console.log(`Server is running on http://localhost:${PORT}/graphql`)});
  
