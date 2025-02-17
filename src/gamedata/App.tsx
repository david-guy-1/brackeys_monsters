import { useState } from 'react'
import game from './game';

import { data_obj as chase_obj  } from './chase_gameData';
import { data_obj as move_obj } from './move_gameData';
import { data_obj as stealth_obj } from './stealth_gameData';
import { events } from '../EventManager';
import GameDisplay, { clone_gamedata } from '../GameDisplay';
import { lincomb, moveIntoRectangleBR } from '../lines';
import { canvas_size, player_box } from './constants';
function move_canvas(e : MouseEvent, g:game, store : globalStore_type){
  if(g.mode == "chase" || g.mode == "stealth"){
    if((e.target as HTMLElement).getAttribute("data-key")?.indexOf("main_canvas") != -1){ // topmost canvas element that is valid
        let scroll = lincomb(1, g.player, -1, store.player_pos) as point;  //game-coords of top left corner 
          // x -> x - scroll  
        g.target= lincomb(1, [e.offsetX, e.offsetY], 1, scroll) as point;  
        store.target_pos = moveIntoRectangleBR(  [e.offsetX, e.offsetY] ,player_box ) as point ;
        
    }
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
  if(mode == "menu"){
      return <button onClick={() => {setG(new game()); setMode("stealth");} }>Click to start</button>;
  }else if (mode == "chase"){
      // set up game 
        g?.setup_chase(2000, 2000)
        let data = clone_gamedata(chase_obj); 
        data.g = g;
        data.prop_fns["new_game"] =  () => transition("move");
        // register event listener;
        events["mousemove a"] = [move_canvas, g]
        let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, target_pos: lincomb(1, [0,0], 0.5, canvas_size) as point }
        return <GameDisplay data={data} globalStore={store} />  
  } else if (mode == "move"){
      g?.setup_move(10, 10);
      let data = clone_gamedata(move_obj);
      console.log(data);
      data.g = g;
      data.prop_fns["new_game"] = () => transition("stealth");
      delete events["mousemove a"];
      let store : globalStore_type = {player_pos : [0,0], target_pos : [0,0]};
      return <GameDisplay data={data} globalStore={store} />  
  }  else if (mode == "stealth"){
    g?.setup_stealth(2000, 2000);
    let data = clone_gamedata(stealth_obj); 
    data.g = g;
    data.prop_fns["new_game"] =  () => transition("chase");
    // register event listener;
    events["mousemove a"] = [move_canvas, g]
    let store : globalStore_type = {player_pos : lincomb(1, [0,0], 0.5, canvas_size) as point, target_pos: lincomb(1, [0,0], 0.5, canvas_size) as point }
    return <GameDisplay data={data} globalStore={store} />  
  }
}


export default App