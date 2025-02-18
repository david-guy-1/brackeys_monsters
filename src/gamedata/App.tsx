import { useState } from 'react'
import game, { repel_spell } from './game';

import { data_obj as chase_obj  } from './chase_gameData';
import { data_obj as move_obj } from './move_gameData';
import { data_obj as stealth_obj } from './stealth_gameData';
import { data_obj as repel_obj } from './repel_gameData';
import { data_obj as escort_obj } from './escort_gameData';
import { events } from '../EventManager';
import GameDisplay, { clone_gamedata } from '../GameDisplay';
import { dist, lincomb, moveIntoRectangleBR, normalize } from '../lines';
import { canvas_size, mouse_radius, player_box } from './constants';
import  Test_canvas  from '../test_canvas';

function move_canvas(e : MouseEvent, g:game, store : globalStore_type){
  if(g.mode == "chase" || g.mode == "stealth" || g.mode == "escort"){
    if((e.target as HTMLElement).getAttribute("data-key")?.indexOf("main_canvas") != -1){ // topmost canvas element that is valid
      if(dist([e.offsetX, e.offsetY], store.player_pos) > mouse_radius ){
        let scroll = lincomb(1, g.player, -1, store.player_pos) as point;  //game-coords of top left corner 
          // x -> x - scroll  
        g.target= lincomb(1, [e.offsetX, e.offsetY], 1, scroll) as point;  
        console.log(g.target);
        store.target_pos = moveIntoRectangleBR(  [e.offsetX, e.offsetY] ,player_box ) as point ;
      }
        
    }
  }

}

function cast_repel_spell(e : MouseEvent, g : game, store : globalStore_type){
  if(g.time < 2){
    return;
  }
  let v : point = [0,0];
  v = lincomb(1, [e.offsetX, e.offsetY], -1, store.player_pos) as point;  
  if(v[0] == 0 && v[1] == 0){
    v = [0,1];
  }
  g.cast_repel_spell(v[0], v[1], 84);
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
  if(mode == "menu"){
      return <button onClick={() => {setG(new game()); setMode("escort");} }>Click to start</button>;
  }else if (mode == "chase"){
      // set up game 
        g?.setup_chase(2000, 2000)
        let data = clone_gamedata(chase_obj); 
        data.g = g;
        data.prop_fns["new_game"] =  () => transition("move");
        // register event listener;
        events["mousemove a"] = [move_canvas, null]
        let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, target_pos: lincomb(1, [0,0], 0.5, canvas_size) as point, player_last_pos : [0,0] }
        return <GameDisplay data={data} globalStore={store} />  
  } else if (mode == "move"){
      g?.setup_move(10, 10);
      let data = clone_gamedata(move_obj);
      console.log(data);
      data.g = g;
      data.prop_fns["new_game"] = () => transition("stealth");
      delete events["mousemove a"];
      let store : globalStore_type = {player_pos : [0,0], target_pos : [0,0],player_last_pos : [0,0]};
      return <GameDisplay data={data} globalStore={store} />  
  }  else if (mode == "stealth"){
    g?.setup_stealth(2000, 2000);
    let data = clone_gamedata(stealth_obj); 
    data.g = g;
    data.prop_fns["new_game"] =  () => transition("chase");
    // register event listener;
    events["mousemove a"] = [move_canvas, null]
    events["click a"] = [cast_repel_spell, null]
    let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, target_pos: lincomb(1, [0,0], 0.5, canvas_size) as point ,player_last_pos : [0,0]}
    return <GameDisplay data={data} globalStore={store} />  
  } else if (mode == "repel"){
    g?.setup_repel(600,600);
    let data = clone_gamedata(repel_obj); 
    data.g = g;
    data.prop_fns["new_game"] =  () => transition("menu");
    // register event listener;
    events["click a"] = [cast_repel_spell, null]
    let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, target_pos: lincomb(1, [0,0], 0.5, canvas_size) as point ,player_last_pos : [0,0]}
    return <GameDisplay data={data} globalStore={store} />  
    
  }else if (mode == "escort"){
    // set up game 
      g?.setup_escort(2000, 2000, [[200,200], [800, 200], [1300, 10],[1900, 1100],[1950, 1800], [600, 1800], [400, 100]], 10);
      let data = clone_gamedata(escort_obj); 
      data.g = g;
      data.prop_fns["new_game"] =  () => transition("chase");
      // register event listener;
      events["mousemove a"] = [move_canvas, null]
      let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, target_pos: lincomb(1, [0,0], 0.5, canvas_size) as point, player_last_pos : [0,0] }
      return <GameDisplay data={data} globalStore={store} />  
  }
  else if (mode == "test"){
    return <Test_canvas />;
  }
}


export default App