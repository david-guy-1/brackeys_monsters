import { animation } from "../animations";
import { d_image } from "../canvasDrawing";
import { game_interface, point3d } from "../interfaces";
import { lerp, moveTo, point_to_color } from "../lines";
import game from "./game";

export class explode_anim implements animation<game>{
    x:number;
    y:number;
    cx : number;
    cy : number;
    lifespan = 30;
    canvas : string = "anim_frame";
    constructor(x : number,y : number){
        this.x=x+(Math.random()  - 0.5);
        this.y=y+(Math.random()  - 0.5);
        this.cx = x;
        this.cy = y; 
    }
    draw(g : game_interface, globalStore : globalStore_type) : draw_command[] {
        let color : point3d = lerp([255,0,0], [255,255,255], this.lifespan/30) as point3d;
        return [{type:"drawCircle", x:this.x, y:this.y, r:3,"fill":true,color:point_to_color(color)}]; 
    }
    update(g : game_interface, globalStore : globalStore_type){
        [this.x,this.y] = moveTo([this.x,this.y],[this.cx, this.cy],-5)
        this.lifespan--;
        return this.lifespan <= 0;
    }
}


export class coin_anim implements animation<game>{
    x:number;
    y:number;
    frame:number;
    id : number;
    canvas: string = "anim_frame";
    constructor(x : number,y : number,frame : number,id:number){
        this.x=x;
        this.y=y;
        this.frame=frame;
        this.id = id;
    }
    draw(g : game, globalStore : globalStore_type){
        return [d_image(`images/coin${this.frame%3 + 1}.png`,this.x-10, this.y-10)];
    }
    update(g: game, globalStore: globalStore_type){
        this.frame++; 
        return g.collected[this.id];
    }
}
