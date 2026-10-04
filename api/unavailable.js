export default {
  fetch() {
    return Response.json({error:'Chat and saved records are not connected on this Vercel preview yet. Your input remains on screen.',ai:false,persistence:false},{status:503,headers:{'Cache-Control':'no-store'}});
  }
};
