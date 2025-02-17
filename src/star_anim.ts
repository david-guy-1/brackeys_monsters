import { animation } from "./animations";

type point = [number, number]; 

class star implements animation {
    r1:number;
    r2:number;
    x:number;
    y:number;
    dx:number;
    dy:number;
    angle:number;
    spinspeed:number; 
    color:[number,number,number];
    lifespan:number;
    init : number;

    constructor(r1 : number,r2 : number,x : number,y : number,dx : number,dy : number,angle : number,spinspeed:number, color : [number,number,number],lifespan : number){
        this.r1=r1;
        this.r2=r2;
        this.x=x;
        this.y=y;
        this.dx=dx;
        this.dy=dy;
        this.angle=angle;
        this.spinspeed = spinspeed
        this.color=color;
        this.lifespan=lifespan;
        this.init=lifespan;
    }
    update(){
        this.x += this.dx;
        this.y += this.dy;
        this.angle += this.spinspeed; 
        this.lifespan -= 1;
        return this.lifespan <= 0;
    }
    draw(){ 
        var r1 = this.r1;
        var r2 = this.r2;
        var angle = this.angle; 
        var x = this.x;
        var y = this.y; 
        var interval = 2*Math.PI / 5;
        var points :point[]= []
        for(var i=0; i<10; i++){
            var t = interval * i/2 + angle
            if(i%2 == 0){
                points.push([Math.cos(t)*r2+x, Math.sin(t)*r2+y])
            } else { 
                points.push([Math.cos(t)*r1+x, Math.sin(t)*r1+y])
            }
        }
        var d : drawPolygon_command = {type:"drawPolygon", "color":`hsla(${this.color[0]},${this.color[1]}%,${this.color[2]}%,${this.lifespan/this.init > 0.5 ? 1 : this.lifespan/this.init*2 })`, "fill":true, "points_x" : points.map((x) => x[0]), "points_y": points.map((x) => x[1])}
        return [d];
    }
}

export default star; 