

type eventCall = [(e : any, g : any, globalStore : globalStore_type , params : any ) => void , any]

// register events by putting things in this :
// strings must have mousemove, click, keydown, or keyup in them. 
export let events : Record<string, eventCall> = {};

let g: any = undefined;
let globalStore : globalStore_type | undefined= undefined // set from set_events, do NOT set this manually 

export function call_mousemove(e : MouseEvent){
    if(globalStore == undefined){
        return;
    }
 //   console.log(events);
    for(let item of Object.keys(events)){
        if(item.indexOf("mousemove") != -1){
            let [fn, params] = events[item];
            fn(e, g, globalStore, params); 
        }
    }
}

export function call_click(e : MouseEvent){
    if(globalStore == undefined){
        return;
    }
    for(let item of Object.keys(events)){
        if(item.indexOf("click") != -1){
            let [fn, params] = events[item];
            fn(e, g, globalStore, params); 
        }
    }
}
export function call_keydown(e : KeyboardEvent){
    if(globalStore == undefined){
        return;
    }
    for(let item of Object.keys(events)){
        if(item.indexOf("keydown") != -1){
            let [fn, params] = events[item];
            fn(e, g, globalStore, params); 
        }
    }
}
export function call_keyup(e : KeyboardEvent){
    if(globalStore == undefined){
        return;
    }
    for(let item of Object.keys(events)){
        if(item.indexOf("keyup") != -1){
            let [fn, params] = events[item];
            fn(e, g, globalStore, params); 
        }
    }
}

export function call_mousedown(e : MouseEvent){
    if(globalStore == undefined){
        return;
    }
    for(let item of Object.keys(events)){
        if(item.indexOf("mousedown") != -1){
            let [fn, params] = events[item];
            fn(e, g, globalStore, params); 
        }
    }
}
export function call_mouseup(e : MouseEvent){
    if(globalStore == undefined){
        return;
    }
    for(let item of Object.keys(events)){
        if(item.indexOf("mouseup") != -1){
            let [fn, params] = events[item];
            fn(e, g, globalStore, params); 
        }
    }
}
// mobile
export function call_touchdown(e : TouchEvent){
    if(globalStore == undefined){
        return;
    }
    for(let item of Object.keys(events)){
        if(item.indexOf("touchstart") != -1){
            let [fn, params] = events[item];
            fn(e, g, globalStore, params); 
        }
    }
}
export function call_touchup(e : TouchEvent){
    if(globalStore == undefined){
        return;
    }
    for(let item of Object.keys(events)){
        if(item.indexOf("touchend") != -1){
            let [fn, params] = events[item];
            fn(e, g, globalStore, params); 
        }
    }
}



// call this once
let added = false; 
export function set_events(g_2 : any, globalStore_2 : globalStore_type) {
    g = g_2;
    globalStore = globalStore_2;
    if(added == false){
        document.addEventListener("mousemove", (e) => call_mousemove(e));
        document.addEventListener("click", (e) => call_click(e));
        document.addEventListener("keydown", (e) => call_keydown(e));
        document.addEventListener("keyup", (e) => call_keyup(e));
        document.addEventListener("mousedown", (e) => call_mousedown(e));
        document.addEventListener("mouseup", (e) => call_mouseup(e));
        document.addEventListener("touchstart", (e) => call_touchdown(e));
        document.addEventListener("touchend", (e) => call_touchup(e));
    } 
    added = true;
}