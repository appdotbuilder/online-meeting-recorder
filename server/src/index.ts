import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createRecordingInputSchema, 
  updateRecordingInputSchema, 
  getRecordingInputSchema,
  deleteRecordingInputSchema 
} from './schema';

// Import handlers
import { createRecording } from './handlers/create_recording';
import { updateRecording } from './handlers/update_recording';
import { getRecordings } from './handlers/get_recordings';
import { getRecording } from './handlers/get_recording';
import { deleteRecording } from './handlers/delete_recording';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Recording management endpoints
  createRecording: publicProcedure
    .input(createRecordingInputSchema)
    .mutation(({ input }) => createRecording(input)),
    
  updateRecording: publicProcedure
    .input(updateRecordingInputSchema)
    .mutation(({ input }) => updateRecording(input)),
    
  getRecordings: publicProcedure
    .query(() => getRecordings()),
    
  getRecording: publicProcedure
    .input(getRecordingInputSchema)
    .query(({ input }) => getRecording(input)),
    
  deleteRecording: publicProcedure
    .input(deleteRecordingInputSchema)
    .mutation(({ input }) => deleteRecording(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();