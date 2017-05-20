var socket=io();
var user;
var col;
var grid=[];
var rows=6;
var cols=7;
var w=50;

function setup(){
    createCanvas(400,500);
    for(var i=0;i<rows;i++){
        grid[i]=new Array(cols);
    }

    for(var i=0;i<rows;i++){
        for(var j=0;j<cols;j++){
            grid[i][j]=new Ball(i*50,j*50);
        }
    }
}


function draw(){
    background(150,150,150);
    translate(50,50);
    for(var i=0;i<rows;i++){
        for(var j=0;j<cols;j++){
            grid[i][j].show();
        }
    }
    socket.on('paint',function(data){
		if(data.color=='red'){
			grid[data.i][data.j].moveSphere(255,0,0);
		}else{
			grid[data.i][data.j].moveSphere(0,255,0);
		}
		socket.emit("checkStatus",{});
	});
}

function Ball(x,y){
    this.pos=createVector(x,y);
    this.r=150;
    this.g=150;
    this.b=150;
    this.changed=false;
    this.changeColor=function(r,g,b){
        this.r=r;
        this.g=g;
        this.b=b;
        this.changed=true;
    }
    this.moveSphere=function(r,g,b){
       	this.changeColor(r,g,b);
    }
    this.show=function(){
        stroke(255);
        fill(150,230,100);
        rect(this.pos.x,this.pos.y,w,w);
        push();
        translate(this.pos.x+w/2,this.pos.y+w/2);
        fill(this.r,this.g,this.b);
        ellipse(0,0,w-2,w-2);
        pop();

    }

}


socket.on('interrupt',function(data){
	console.log(data.msg);
});

socket.on('authenticated',function(data){
	user=data.user;
	col=data.color;
});

socket.on('removeButtom',function(data){
	var x=data.i;
	for(var j=6;j>=1;j--){
		grid[x][j].r=grid[x][j-1].r;
		grid[x][j].g=grid[x][j-1].g;
		grid[x][j].b=grid[x][j-1].b;
		grid[x][j].changed=grid[x][j-1].changed;
	}
	if(grid[x][0].changed){
		grid[x][0].r=150;
		grid[x][0].g=150;
		grid[x][0].b=150;
		grid[x][0].changed=false;
	}
	socket.emit("checkStatus",{});
});

socket.on('error',function(data){
	console.log(data.msg);
});

socket.on("endOfGame",function(data){
	document.getElementById("end").innerHTML="<h2>winners:"+data.winners+"</h2>";
	socket.emit("closeServer",{});
});

function mousePressed(){
	var x=Math.floor((mouseX-50)/50);
	var y=Math.floor((mouseY-50)/50);
    socket.emit("move",{
    	user:user,
    	color:col,
    	i:x,
    	j:y
    });
}

