var http = require("http");
var fs = require("fs");
var mime=require("mime");
var path = require("path");
var cache={};
var users={
	1:"lucky",
	2:"nikun"
};
var colors={
	1:"red",
	2:"green"
}
var count=0;
var turn="lucky";
var next="nikun";
var grid=[];
var marked=[];
var rows=6;
var cols=7;

for(var i=0;i<rows;i++){
	grid[i]=new Array(cols);
	marked[i]=new Array(cols);
}

for(var i=0;i<rows;i++){
	for(var j=0;j<cols;j++){
		grid[i][j]=false;
		marked[i][j]="none";
	}
}


var server = http.createServer(function(request,response){
	var filePath =false;
	if(request.url == '/'){
		filePath = 'public/index.html';
	}else{
		filePath = 'public/'+request.url;
	}
	var absPath = './'+filePath;
	serveStatic(response, cache, absPath);
});

server.listen(3000,function(){
	console.log("server running at port number  3000");
});

function send404(response) {
	response.writeHead(404, {'Content-Type': 'text/plain'});
	response.write('Error 404: resource not found.');
	response.end();
}

function sendFile(response, filePath, fileContents) {
	response.writeHead(200,{
		"content-type": mime.lookup(path.basename(filePath))
	});
	response.end(fileContents);
}

function serveStatic(response, cache, absPath) {
	if (cache[absPath]) {
		sendFile(response, absPath, cache[absPath]);
	} else {
		fs.exists(absPath, function(exists) {
		if (exists) {
			fs.readFile(absPath, function(err, data) {
				if (err) {
					send404(response);
				} else {
					cache[absPath] = data;
					sendFile(response, absPath, data);
				}
		});
		} else {
		send404(response);
		}
		});
	}
}

var io = require("socket.io")(server);



io.on('connection',function(socket){
	console.log("user connected");
	count++;
	if(count>2){
		socket.emit('interrupt',{
			msg:"more than two users are not allowed"
		});
	}else{
		socket.emit('authenticated',{
			'user':users[count],
			'color':colors[count]
		});
	}

	socket.on("move",function(data){
		if(data.user==turn){
			var index;
			if(data.user=='lucky'){
				index=1;
			}else{
				index=2;
			}
			if(!grid[data.i][data.j]){
				io.sockets.emit("paint",{
					i:data.i,
					j:data.j,
					color:data.color
				});
				grid[data.i][data.j]=true;
				marked[data.i][data.j]=data.color;
			}else{
				if(data.j==6 && data.color==marked[data.i][data.j]){
					io.sockets.emit("removeButtom",{
						i:data.i
					});
					for(var j=6;j>=1;j--){
						grid[data.i][j]=grid[data.i][j-1];
						marked[data.i][j]=marked[data.i][j-1];
					}
					if(grid[data.i][0]){
						grid[data.i][0]=false;
						marked[data.i][0]="none";
					}
				}else{
					io.sockets.emit('error',{
						msg:"already filled"
					});
				}
				
			}
			var temp=turn;
			turn=next;
			next=temp;
		}
	});



	socket.on("checkStatus",function(data){
		var checkRow=false;
		var checkCol=false;
		var checkDia=false;
		var winnerLucky=false;
		var winnerNikun=false;
		for(var i=0;i<rows;i++){
			for(var j=0;j<cols-4;j++){
				var check=marked[i][j];
				if(check!="none" && marked[i][j+1]==check && marked[i][j+2]==check && marked[i][j+3]==check){
					checkRow=true;
					if(marked[i][j]=='red'){
						winnerLucky=true;
					}else{
						winnerNikun=true;
					}
				}
			}	
		}
		for(var j=0;j<cols;j++){
			for(var i=0;i<rows-4;i++){
				var check=marked[i][j];
				if(check!="none" &&  marked[i+1][j]==check && marked[i+2][j]==check && marked[i+3][j]==check){
					checkCol=true;
					if(marked[i][j]=='red'){
						winnerLucky=true;
					}else{
						winnerNikun=true;
					}
				}
			}
		}
			for(var i=0;i<rows-4;i++){
				for(var j=0;j<cols-4;j++){
					var check=marked[i][j];
					if(check!="none" && marked[i+1][j+1]==check && marked[i+2][j+2]==check && marked[i+3][j+3]==check){
						checkDia=true;
						if(marked[i][j]=='red'){
							winnerLucky=true;
						}else{
							winnerNikun=true;
						}
					}
				}
			}

		if(checkRow||checkCol||checkDia){
			var winners=[];
			if(winnerLucky){
				winners.push("lucky");
			}
			if(winnerNikun){
				winners.push("nikun");
			}
			io.sockets.emit("endOfGame",{
				winners:winners
			});
		}
	});

	socket.on("closeServer",function(data){
		io.sockets.sockets.forEach(function(s){
			s.disconnect(true);
		});	
	});


	socket.on('disconnect',function(){
		console.log("user disconnected");
	});


});



