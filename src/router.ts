import { Router } from 'itty-router';
import { Octokit } from 'octokit';

// Router (note the lack of "new")
const router = Router();

// Combined Github downloads
async function dlGithub(env: Env) {
  var downloads = 0
  try {
    const octokit = new Octokit({
      auth: `${env.githubtoken}`,
    })

    var response = await octokit.request('GET /repos/{owner}/{repo}/releases', {
      owner: 'szapp',
      repo: 'Ninja',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
        'Accept': 'application/json'
      }
    })
    for (var release of response.data) {
      for (var assest of release.assets) {
        downloads += assest.download_count
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log('error message: ', error.message);
    } else {
      console.log('unexpected error: ', error);
    }
  }

  return downloads
}

// Combined steam downloads
async function dlSteam(appId) {
  var downloads = 0
  const response = await fetch('https://img.shields.io/steam/downloads/' + appId, {
    method: 'GET',
    headers: {
      Accept: 'text/plain',
    },
  });
  const result = await response.text()
  const steamDlRegExp = /<title>downloads: ([\d\w]+)<\/title>/
  const stemaMatch = result.match(steamDlRegExp)
  try {
    var steamVer = stemaMatch.slice(1)[0]
    if (steamVer.endsWith('k')) {
      steamVer = steamVer.substr(0,steamVer.length-1) * 1000
    } else if (steamVer.endsWith('m')) {
      steamVer = steamVer.substr(0,steamVer.length-1) * 1000 * 1000
    }
    downloads = +steamVer
  } catch (error) {
    if (error instanceof Error) {
      console.log('error message: ', error.message);
    } else {
      console.log('unexpected error: ', error);
    }
  }

  return downloads
}

// World of Gothic downloads
async function dlWoG() {
  var downloads = 0
  try {
    const response = await fetch('https://www.worldofgothic.de/dl/download_652.htm', {
      method: 'GET',
      headers: {
        Accept: 'text/html',
      },
    });
    const htmlText = await response.text()
    const wogDlRegExp = /<td>\s*<b>\s*Downloads:\s*<\/b>\s*<\/td>\s*<td>\s*(\d+)\s*<\/td>/
    const wogMatch = htmlText.match(wogDlRegExp)
    downloads = +wogMatch.slice(1)[0]
  } catch (error) {
    if (error instanceof Error) {
      console.log('error message: ', error.message);
    } else {
      console.log('unexpected error: ', error);
    }
  }

  return downloads
}

// Spine downloads
function dlSpine() {
  console.warn('Could not retrieve Spine downloads. Hard coded value as of Dec 2023.')
  const downloads = 140500  // Hard coded for now
  return downloads
}

async function getDownloads(id, env: Env) {
  switch (id.toLowerCase()) {
    case 'steam':
      return await dlSteam(2786936496) + await dlSteam(2786910489)

    case 'steam-g1':
      return await dlSteam(2786936496)

    case 'steam-g2':
      return await dlSteam(2786910489)

    case 'worldofgothic':
    case 'worldofplayers':
    case 'wog':
      return await dlWoG()

    case 'github':
      return await dlGithub(env)

    case 'spine':
      return dlSpine()

    case 'all':
      return await dlGithub(env) + await dlSteam(2786936496) + await dlSteam(2786910489) + await dlWoG() + dlSpine()
  }
}

// Make JSON
function getJSON(count) {
  var message = '';
  if (count > 1000 * 1000) {
    message = Math.round(count / 1000000) + 'm';
  } else if (count > 1000) {
    message = Math.round(count / 1000) + 'k';
  }

  const output = {
    schemaVersion: 1,
    label: 'downloads',
    message: message,
    color: '#4c1'
  };

  return new Response(
    JSON.stringify(output),
    { headers: { 'Content-Type': 'application/json' } }
  );
}

// GET collection index
router.get('/api/downloads', async (request: Request, env: Env) => {
  const output = {
    routes: [
      'all',
      'steam',
      'steam-g1',
      'steam-g2',
      ['worldofgothic', 'worldofplayers', 'wog'],
      'spine',
      'github',
    ],
  };

  return new Response(
    JSON.stringify(output),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

// GET item
router.get('/api/downloads/:id', async ({ params }, env: Env) => {
  const downloads = await getDownloads(params.id, env)
  if (downloads != null) {
    return getJSON(downloads);
  } else {
    return new Response('Not Found.', { status: 404 });
  }
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
