import {handleVercelApi} from '../server/vercel-api.js';

export default {
  fetch(request){return handleVercelApi(request,process.env);}
};
