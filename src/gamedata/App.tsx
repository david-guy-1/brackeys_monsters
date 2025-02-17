import React, { useState } from 'react'
import game from './game';

import { anim_fn, button_click, display, draw_fn, data_obj, init, prop_commands, reset_fn, sound_fn } from './GameData';
import { events } from '../EventManager';
import GameDisplay, { clone_gamedata } from '../GameDisplay';
import { gamedata } from '../interfaces';
import { all_combos } from '../lines';

function move_canvas(e : MouseEvent, g:game){
    if((e.target as HTMLElement).getAttribute("data-key") == "anim_frame"){ // topmost canvas element that is valid
        g.target= [e.offsetX, e.offsetY]
    }
}


function App() {

  const [g, setG] = useState<game | undefined>(undefined);
  if(g == undefined){
    
    return <button onClick={() => setG(new game())}>Click to start</button>
  } else {
    // get gameData
    let data = clone_gamedata(data_obj); 
    data.g = g;
    data.prop_fns["new_game"] =  function(){setG(undefined)};
    // register event listener;
    events["mousemove a"] = [move_canvas, g]
    let store : globalStore_type = {
      first_frame : false,
      all_complete : false,
      "current_image" : data.display.image[0][0],
      all_collected : false
    }

    return <GameDisplay data={data} globalStore={store} />
  }
}

export default App