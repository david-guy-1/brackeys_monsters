import { animation } from "../animations";
import { add_com, d_bezier, d_circle, d_image } from "../canvasDrawing";
import { game_interface, point3d } from "../interfaces";
import { lerp, lincomb, moveTo, point_to_color } from "../lines";
import { displace_command, scale_command } from "../rotation";
import { cauldron_pos } from "./constants";
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


export class potion_anim implements animation<game>{
    x:point;
    color:string;
    drop : number = 30;
    canvas: string = "anims";
    constructor(x : point,color : string){
        this.x=x;
        this.color=color;
    }
    update(){
        this.drop+= this.x[1] < 200 ? 6 : 3;
        console.log("updating");
        return this.x[1] + this.drop > cauldron_pos[1]
    }
    draw(){
        let bezier_points : point[] = [[42,317],[55,333],[67,351],[104,363],[152,371],[175,361],[178,351],[184,343],[185,325],[175,300],[159,265],[141,243],[120,220],[107,206],[85,196],[69,194],[52,194],[43,203],[39,215],[33,233],[33,245],[31,261],[30,271],[30,282],[31,291],[18,301],[10,305],[-4,315],[3,323],[3,325],[8,333],[17,329],[29,324],[41,317]]
        let bezier = d_bezier(bezier_points, true)[0] as drawBezierShape_command;
        bezier = add_com(bezier, {"color": "#cccccc", "fill":true}) as drawBezierShape_command; 
        let center : point= [99, 282]
        let bezier_inside : point[] = bezier_points.slice(2, 24);
        let bezier_2 = add_com(d_bezier(bezier_inside, true)[0], {"color": this.color, "fill":true}) as drawBezierShape_command;
        bezier_2 = scale_command(bezier_2,center, 0.8, 0.8) as drawBezierShape_command;
        let lst : draw_command[] = [bezier, bezier_2];
        lst = lst.map(x => displace_command(x, lincomb(1, [0,0], -1, center) as point ));
        lst = lst.map(x => scale_command(x,[0,0], 0.5, 0.5));
        lst = lst.map(x => displace_command(x, this.x));
        return lst.concat([add_com(d_circle(this.x[0]-50, this.x[1] + this.drop, 10), {color : this.color, fill:true} )])
    }
}