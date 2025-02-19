import { useState } from 'react'
import game, { repel_spell } from './game';

import { data_obj as chase_obj  } from './chase_gameData';
import { data_obj as move_obj } from './move_gameData';
import { data_obj as stealth_obj } from './stealth_gameData';
import { data_obj as repel_obj } from './repel_gameData';
import { data_obj as escort_obj } from './escort_gameData';
import { data_obj as collect_obj } from './collect_gameData';
import { events } from '../EventManager';
import GameDisplay, { clone_gamedata } from '../GameDisplay';
import { dist, lincomb, moveIntoRectangleBR, normalize } from '../lines';
import { canvas_size, mouse_radius, player_box } from './constants';
import  Test_canvas  from '../test_canvas';
import { gamedata } from '../interfaces';

function move_canvas(e : MouseEvent, g:game, store : globalStore_type){
  if(g.mode == "chase" || g.mode == "stealth" || g.mode == "escort" || g.mode == "collect"){
    if((e.target as HTMLElement).getAttribute("data-key")?.indexOf("main_canvas") != -1){ // topmost canvas element that is valid
      store.mouse_pos = [e.offsetX, e.offsetY];// set mouse position 
    }
  }
}


function keydown(e : KeyboardEvent, g : game, store : globalStore_type ){
  let direction_vector : point = lincomb(1, store.mouse_pos, -1, store.player_pos) as point;  
  if(direction_vector[0] == 0 && direction_vector[1] == 0){
    direction_vector = [0,1];
  }
  if(e.key.toLowerCase() == "q"){
    g.cast_repel_spell(direction_vector[0], direction_vector[1], 60,84);
  }
  if(e.key.toLowerCase() == "w"){
    g.cast_fireball_spell(direction_vector[0], direction_vector[1], 60,84);
  }
  if(e.key.toLowerCase() == "e"){
    g.start_swing(100, Math.atan2(direction_vector[1], direction_vector[0]),  15,0.2);
    
  }
}

function App() {
  const [g, setG] = useState<game | undefined>(undefined);
  const [mode, setMode] = useState<string>("menu");
  const [transitioning, setTransitioning] = useState<boolean>(false);
  function transition(s : string){
    setTransitioning(true);
    setTimeout(() => {setMode(s); setTransitioning(false)}, 0);
  }
  if(transitioning){
    return <></>
  }
  // default store, override it if necessary 
  let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, player_last_pos : [0,0] , mouse_pos : [0,0]}; 
  let data : gamedata = clone_gamedata(chase_obj);
  events["mousemove a"] = [move_canvas, null]
  events["keydown a"] = [keydown, null];
  if(mode == "menu"){
      return <button onClick={() => {setG(new game()); setMode("chase");} }>Click to start</button>;
    }else if (mode == "chase"){
      // set up game 
      g?.setup_chase(2000, 2000)
      data = clone_gamedata(chase_obj); 
      data.g = g;
      data.prop_fns["new_game"] =  () => transition("move");
      // register event listener;
  } else if (mode == "move"){
      g?.setup_move(10, 10);
      data = clone_gamedata(move_obj);
      console.log(data);
      data.g = g;
      data.prop_fns["new_game"] = () => transition("stealth");
  }  else if (mode == "stealth"){
    g?.setup_stealth(2000, 2000);
    data = clone_gamedata(stealth_obj); 
    data.g = g;
    data.prop_fns["new_game"] =  () => transition("repel");
    // register event listener;
  } else if (mode == "repel"){
    g?.setup_repel(600,600);
    data = clone_gamedata(repel_obj); 
    data.g = g;
    data.prop_fns["new_game"] =  () => transition("escort");
    // register event listener;
    
  }else if (mode == "escort"){
    // set up game 
      g?.setup_escort(2000, 2000, [[200,200], [800, 200], [1300, 10],[1900, 1100],[1950, 1800], [600, 1800], [400, 100]], 10);
      data = clone_gamedata(escort_obj); 
      data.g = g;
      data.prop_fns["new_game"] =  () => transition("collect");
      // register event listener;
  }
  else if (mode == "collect"){
    // set up game 
      g?.setup_collect(2000, 2000);
      data = clone_gamedata(collect_obj); 
      data.g = g;
      data.prop_fns["new_game"] =  () => transition("chase");
      // register event listener;
  }
  else if (mode == "test"){
    return <Test_canvas />;
  }
  return <GameDisplay data={data} globalStore={store} />  

}


export default App