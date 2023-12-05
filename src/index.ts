/**
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 */

import apiRouter from './router';
import favicon from './favicon.json';

export interface Env {
  githubtoken: string;
}

// Export a default object containing event handlers
export default {
  // The fetch handler is invoked when this worker receives a HTTP(S) request
  // and should return a Response (optionally wrapped in a Promise)
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // You'll find it helpful to parse the request.url string into a URL object. Learn more at https://developer.mozilla.org/en-US/docs/Web/API/URL
    const url = new URL(request.url);

    // You can get pretty far with simple logic like if/switch-statements
    switch (url.pathname) {
      case '/download':
      case '/downloads':
        return new Response(
            `<!DOCTYPE html><html>
             <html>
             <head>
              <meta http-equiv="Content-type" content="text/html;charset=UTF-8">
              <link rel="icon" href="data:image/x-icon;base64,${favicon['favicon.png']}">
              <title>Ninja - Downloads</title>
              <style language='css'>
                html, body {
                  color: #333;
                  font-family: Arial;
                  margin-top: 10px;
                }
                p {
                  margin: 5px;
                }
                div.title {
                  color: #aaa;
                  font-weight: 600;
                  font-size: 28pt;
                  margin-bottom: 20px;
                }
              </style>
             </head>
             <body style='background-color: #030308;'>
              <div align='center'>
                <div class='title'>Ninja</div>
                <p><a href='https://github.com/szapp/Ninja/releases'><img alt='Github downloads' src='https://img.shields.io/github/downloads/szapp/Ninja/total?logo=github&label=Github'></a></p>
                <p><a href='https://steamcommunity.com/sharedfiles/filedetails/?id=2786936496'><img alt='Steam Gothic 1 downloads' src='https://img.shields.io/steam/downloads/2786936496?logo=steam&label=Steam%20Gothic%201'></a></p>
                <p><a href='https://steamcommunity.com/sharedfiles/filedetails/?id=2786910489'><img alt='Steam Gothic 2 downloads' src='https://img.shields.io/steam/downloads/2786910489?logo=steam&label=Steam%20Gothic%202'></a></p>
                <p><a href='https://www.worldofgothic.de/dl/download_652.htm'><img alt='World of Gothic downloads' src='https://img.shields.io/endpoint?url=https%3A%2F%2Fninja.szapp.de%2Fapi%2Fdownloads%2Fwog&label=World%20of%20Gothic&cacheSeconds=86400'></a></p>
                <p><a href='https://clockwork-origins.com/spine'><img alt='Spine downloads' src='https://img.shields.io/endpoint?url=https%3A%2F%2Fninja.szapp.de%2Fapi%2Fdownloads%2Fspine&label=Spine&cacheSeconds=86399'></a></p>
              </div>
             </body></html>
            `,
            { headers: { 'Content-Type': 'text/html' } }
        );
    }

    if (url.pathname.startsWith('/api/')) {
      return apiRouter.handle(request, env);
    }

    return Response.redirect('https://github.com/szapp/Ninja/wiki');
  },
};
