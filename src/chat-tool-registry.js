// Rendering contracts only. Server action validation remains authoritative.
export const CHAT_TOOL_REGISTRY=Object.freeze({
  reflection:{action:'reflect',version:'1.0.0',requiresSelection:true},
  checkin:{route:'#check-in',version:'1.0.0',requiresSelection:true},
  practice:{version:'1.0.0',requiresRegistryId:true,requiresSelection:true},
  progress:{route:'#progress',version:'1.0.0',requiresSelection:true}
});
export function chatTool(kind){if(!Object.hasOwn(CHAT_TOOL_REGISTRY,kind))return null;return CHAT_TOOL_REGISTRY[kind];}
