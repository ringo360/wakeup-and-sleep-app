import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { addusr, findusr, genRefToken, IsValidToken, sleep } from './util';
import { port } from './config';
import auth from './auth';

//p-dev.ringoxd.dev
const app = new Hono();

app.route('/auth', auth);

app.use(logger());

app.use(
  '/v1/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'DELETE'],
    allowHeaders: ['*'],
  }),
);

/*
app.options('*', async (c) => {
  return c.json({
    'Status': 'OK'
  })
})
*/

app.post('/v1/user', async (c) => {
  try {
    const body = await c.req.parseBody();
    const { username, password } = body;
    if (!username || !password) {
      return c.json(
        {
          Error: 'Invalid body(need username and password)',
        },
        400,
      ); //read http.cat
    } else {
      const res = addusr(username as string, password as string);
      if (res === 'ok') {
        const res_gr = await genRefToken(
          username as string,
          password as string,
        );
        const isok_r = res_gr[0] as Boolean;
        const msg_r = res_gr[1] as string;
        console.log(res_gr);
        console.log(isok_r);
        console.log(msg_r);
        if (isok_r !== true) {
          return c.json(
            {
              Error: msg_r,
            },
            500,
          );
        }
        return c.json({
          OK: 'Registered!',
          RefreshToken: msg_r,
        });
      } else if (res === 'already exists') {
        return c.json(
          {
            Error: 'Already exists!',
          },
          400,
        );
      }
    }
  } catch (e) {
    console.log(e);
  }
});

app.get('/find/:user', async (c) => {
  const target = c.req.param('user');
  console.log(`Finding ${target}`);
  const res: any = await findusr(target);
  const x = res[0];

  if (x.usrname) {
    return c.json({
      user: x.usrname,
      date: x.creationdate,
    });
  } else {
    return c.json(
      {
        error: `cannot find ${target}`,
      },
      404,
    );
  }
});

app.post('/v1/sleep', async (c) => {
  const body = await c.req.parseBody();
  const { token, username } = body;
  if ((await IsValidToken(token as string)) === false)
    return c.json(
      {
        Result: 'Invalid token.',
      },
      400,
    );
  const res = await sleep(username as string);
  if (!res?.success) {
    return c.json(
      {
        error: 'Database returned false response',
      },
      500,
    );
  }
  return c.json({
    status: 'OK',
    isSleeping: res.isSleeping,
  });
});

app.notFound((c) => {
  return c.text('404 - Are you lost?', 404);
});

console.log(`Listening port ${port}`);
serve({
  fetch: app.fetch,
  port,
});
