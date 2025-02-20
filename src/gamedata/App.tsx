import { useState } from 'react'
import game, { repel_spell } from './game';

import { data_obj as chase_obj  } from './chase_gameData';
import { data_obj as move_obj } from './move_gameData';
import { data_obj as stealth_obj } from './stealth_gameData';
import { data_obj as repel_obj } from './repel_gameData';
import { data_obj as escort_obj } from './escort_gameData';
import { data_obj as collect_obj } from './collect_gameData';
import { data_obj as maze_obj } from './maze_gameData';
import { data_obj as potions_obj } from './potions_gameData';
import { events } from '../EventManager';
import GameDisplay, { clone_gamedata } from '../GameDisplay';
import { between, cell_index, dist, lincomb, moveIntoRectangleBR, normalize } from '../lines';
import { canvas_size, cauldron_pos, mouse_radius, player_box, potion_size, potion_start, potions_per_row } from './constants';
import  Test_canvas  from '../test_canvas';
import { gamedata } from '../interfaces';
import MainMap from './MainMap';
import { loadImage } from '../canvasDrawing';

function move_canvas(e : MouseEvent, g:game, store : globalStore_type){
  if(g.mode == "chase" || g.mode == "stealth" || g.mode == "escort" || g.mode == "collect" || g.mode == "potions"){
    if((e.target as HTMLElement).getAttribute("data-key")?.indexOf("main_canvas") != -1){ // topmost canvas element that is valid
      store.mouse_pos = [e.offsetX, e.offsetY];// set mouse position 
    }
  }
  if(g.mode == "potions"){

  }
}
function click_fn(e : MouseEvent, g : game, store : globalStore_type ){
  if(g.mode == "potions"){
    // clicked on a potion
    let start_coord = lincomb(1, potion_start, -0.5, [potion_size,potion_size]) as point;
    let index = cell_index(start_coord, potion_size, potion_size, potions_per_row, e.offsetX, e.offsetY);
    if(index != undefined){
      let potion = g.potions[index[2]];
      if(g.already_put.indexOf(potion) == -1){
        store.potion_anim_state = {color : g.potions[index[2]], "place" : [cauldron_pos[0]+150, 100]}
      }
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
  events["click a"] = [click_fn, null]
  events["keydown a"] = [keydown, null];
  if(mode == "menu"){
      let image_files = ['background.png', 'bg2.png', 'bg3.png', 'bg4.png', 'bg5.png', 'cauldron.png', 'closed_town.png', 'coin.png', 'escorted.png', 'monster.png', 'open_town.png', 'person.png', 'player.png', 'player_maze.png', 'roaming_monster.png', 'seeing_monster.png', 'targeted_monster.png', 'thingy.png', 'tree.png'];

      let promises = Promise.allSettled(image_files.map(x => loadImage("images/" + x)))
    
      return <button onClick={() => {promises.then(() =>{ setG(new game()); setMode("map");})}}>Click to start</button>;
  }
  else if (mode == "map"){
    if(g){
      return <MainMap g={g} recall={(s : string) => transition(s)}/>
    }
  }  
  else if (mode == "chase"){
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
      data.prop_fns["new_game"] =  () => transition("maze");
      // register event listener;
  } else if (mode == "maze"){
    g?.setup_maze(18,15);
    data = clone_gamedata(maze_obj); 
    data.g = g;
    data.prop_fns["new_game"] =  () => transition("potions");
      
  }else if (mode == "potions"){
    g?.setup_potions(18);
    
    data = clone_gamedata(potions_obj); 
    data.g = g;
    data.prop_fns["new_game"] =  () => transition("chase");
      
  }
  else if (mode == "test"){
    return <Test_canvas />;
  }
  return <GameDisplay data={data} globalStore={store} />  

}


export default App