import { useRef, useEffect } from "react";
import { draw } from "./process_draws";
import { flatten } from "lodash";
import { add_com, d_bezier, d_circle, d_rect, drawBezierShape, make_style } from "./canvasDrawing";
import { displace_command, rotate_command, scale_command } from "./rotation";
import { lincomb, rescale, scalar_multiple } from "./lines";

let commands : draw_command[] = []
let base_points = [[-1,117],[-15,201],[2,166],[14,199]];
let center = base_points[2];

commands.push(add_com(d_rect(0,0,600,600), {"color":"green", "fill":true}));
for(let i=0; i<800; i++){
    let points = JSON.parse(JSON.stringify(base_points))  as point[];
    for(let i=0; i<points.length; i++){
        let displace =[ Math.random() * 40 - 20, Math.random() * 40 - 20]
        points[i] = lincomb(1, points[i], 1, displace) as point;
    }
    //console.log(points);
    let [x,y]  = [Math.random()  * 600,Math.random()  * 600]
    let command : draw_command = {type:"drawPolygon", points_x : points.map(x => x[0]), points_y : points.map(x => x[1]), color:`hsl(${70 + Math.random() * 100}, 100%, ${35 + Math.random()*20}%)`, fill:true};
    command = scale_command(command, center as point, 0.3, 0.3);
    
    command = displace_command(command,scalar_multiple(-1, center) as point);
    command = displace_command(command,[x,y]);
    commands.push(command);
}
function test_canvas(){
    let canvasRef = useRef<HTMLCanvasElement>(null); 
    useEffect(function(){
        //@ts-ignore
        draw(commands, canvasRef)
    }, [])

    return <canvas width={600} height={600} style={{"border": "1px solid black"}} ref={canvasRef} id="test_canvas"></canvas>

}

export default test_canvas;