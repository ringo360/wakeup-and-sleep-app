import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { addusr, db_deleteOne, findusr, genRefToken, getSleepData, isSleeping, IsValidToken, sleep } from './util';
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
      );
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
    //prettier-ignore
    return c.json({
      error: `cannot find ${target}`,
    },404);
  }
});

app.get('/v1/sleeping', async (c) => {
	const token = c.req.header('X-Token')
	const username = c.req.header('X-UserName')
	if (!token || !username) {
		//prettier-ignore
		return c.json({
			'Result': 'Invalid body.'
		},400)
	  }
	  if (!await IsValidToken(token)) {
		//prettier-ignore
		return c.json({
			'Result': 'Invalid token'
		}, 400)
	  }
	const result = await isSleeping(username)
	return c.json({
		'isSleeping': result
	})
})

app.get('/v1/sleep', async (c) => {
	const token = c.req.header('X-Token')
	const username = c.req.header('X-UserName')
  if (!token || !username) {
    //prettier-ignore
    return c.json({
		'Result': 'Invalid body.'
	},400)
  }
  if (!await IsValidToken(token)) {
	//prettier-ignore
	return c.json({
		'Result': 'Invalid token'
	}, 400)
  }
  const result = await getSleepData(username as string)
  return c.json(result)
});

app.post('/v1/sleep', async (c) => {
  const body = await c.req.parseBody();
  const { token, username, date } = body;
  //dateは2024/07/23 | 23:30 | 6:30 の形にする。('|' で区切りやすくする)
  if (!token || !username || !date) {
    //prettier-ignore
    return c.json({
      'Result': 'Invalid body.'
    },400)
  }
  if ((await IsValidToken(token as string)) === false)
    //prettier-ignore
    return c.json({
      Result: 'Invalid token.',
    },400);
  const res = await sleep(username as string, date as string);
  if (!res?.success) {
    //prettier-ignore
    return c.json({
        error: 'Database returned false response',
      },500);
  }
  return c.json({
    status: 'OK',
    isSleeping: res.isSleeping,
  });
});

app.delete('/v1/sleep', async (c) => {
	const token = c.req.header('X-Token')
	const username = c.req.header('X-UserName')
  if (!token || !username) {
    //prettier-ignore
    return c.json({
		'Result': 'Invalid body.'
	},400)
  }
  if (!await IsValidToken(token)) {
	//prettier-ignore
	return c.json({
		'Result': 'Invalid token'
	}, 400)
  }
  if (await db_deleteOne(username)) {
	return c.json({
		status: 'OK'
	})
  } else {
	return c.json({
		status: 'Failed'
	}, 400)
  }
})

app.notFound((c) => {
  return c.json(
    {
      Error: '404 not found',
    },
    404,
  );
});

console.log(`Listening port ${port}`);
export const websv = serve({
  fetch: app.fetch,
  port,
});
