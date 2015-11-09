$(function(){

	function Chat(cfg){
		this.socket = null;
		this.cfg = cfg;
		this.arrName = ''; //缓存昵称
		this.randomAvatar = ['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg','10.jpg','11.jpg','12.jpg','13.jpg']; //随机头像 
		this.avatar = ''; //缓存头像
		this.init();
	}
	Chat.prototype = {
		init : function(){
			var me = this;
			//初始化连接
			me.socket = io.connect();
			//监听连接
			me.socket.on('connect', function(){
				console.log("连接成功");
				me.cfg.mask.addClass('hide');
			});
			//初始化昵称
			if( $.cookie('chatName') == null ){
				var i = Math.ceil( Math.random()*10000 );
				var name = "网友" + i;
				$.cookie('chatName', name, { expires : 1 });
			}
			me.arrName = $.cookie('chatName');
			var area = remote_ip_info.province + "·" + remote_ip_info.city;
			me.cfg.chatName.html(me.arrName);
			me.cfg.address.html(area);
			// 将昵称发送回服务器
			me.socket.emit('login', { name : me.arrName, address : area });
			//初始化头像
			if( $.cookie('avatar') == null ){
				var avatars = me.randomAvatar[ Math.floor( Math.random()*me.randomAvatar.length ) ];
				$.cookie('avatar', avatars, { expires : 1 });
			}
			me.avatar = $.cookie('avatar');	
			me.cfg.avatar.attr('src', "./styles/images/" + me.avatar);
			me.bind();
		},
		displayMsg : function(user, name, avatar, msg, time){
			var me = this;
			var area = remote_ip_info.province + "·" + remote_ip_info.city;
			var str = '<li class="'+user+'">'+
				'<p class="name">'+
				'<img src="./styles/images/'+avatar+'" alt="" width="40px" height="40px" align="center">'+
				'<span>['+area+'] [等级] '+name+'</span>'+
				'<span>'+time+'</span></p>'+
				'<div class="content">'+msg+'</div></li>';
			me.cfg.panel.append(str);
			me.cfg.panel.animate({ scrollTop : me.cfg.panel[0].scrollHeight }, 500);
		},
		bind : function(){
			var me = this;
			// 系统消息
			me.socket.on('system', function(name, userArr, type){
				var msg = name + ( type == 'login' ? "加入" : "离开" ) + "了会话";
				var str = '<li class="alertMsg"><p>'+msg+'</p></li>';
				me.cfg.panel.append(str);
				me.cfg.onlineNum.html(userArr.length);
				//在线人员列表
				var str2 = '';
				for( var i = 0; i< userArr.length; i++ ){
					str2 += '<li class="cl">'+userArr[i]+'</li>';
				}
				me.cfg.onlist.html(str2);
			});

			// 接受新消息
			me.socket.on('newMsg', function(name, avatar, msg, time){
				me.displayMsg('', name, avatar, msg, time);
			});

			//绑定enter
			me.cfg.content.focus(function(event) {
				$('body').keydown(function(event) {
					if( event.keyCode == 13 ){
						me.cfg.send.click();
					}
				});
			});

			//发送消息
			me.cfg.send.click(function(event) {
				if( me.cfg.content.val().trim() == '' )
					return false;

				var msg = me.cfg.content.val();	
				var time = (new Date()).toTimeString().substr(0, 8);
				me.cfg.content.val('');
				//将消息显示在自己的消息框内
				me.displayMsg('me', me.arrName, me.avatar, msg, time);
				//将消息发送给服务器
				me.socket.emit('postMsg', me.arrName, msg, me.avatar, time);
			});
		}
	}

	new Chat({
		mask : $('.mask'),
		chatName : $('.chatName'),
		address : $('.address'),
		panel : $('.msglist'),
		onlineNum : $('.onlineNum'),
		onlist : $('.onlist'),
		send : $('.send'),
		content : $('#chat-content'),
		avatar : $('#avatar')
	});
});