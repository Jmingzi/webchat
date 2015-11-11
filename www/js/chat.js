$(function(){
	function Chat(cfg){
		this.socket = null;
		this.cfg = cfg;
		this.arrName = ''; //缓存昵称
		//随机头像 
		this.randomAvatar = ['1.jpg','2.jpg','3.jpg','4.jpg','5.jpg','6.jpg','7.jpg','8.jpg','9.jpg','10.jpg','11.jpg','12.jpg','13.jpg']; 
		this.avatar = ''; //缓存头像
		/*
		* 积分设置
		* 登陆一次 +2`
		* 等级说明： { 0-50 : 英勇青铜，50-100：不屈白银，100-200：荣耀黄金，200-300：华贵白金，300-400：璀璨钻石，400-500：超凡大师，>500：最强王者 }
		*/
		this.level = ['英勇青铜', '不屈白银', '荣耀黄金', '华贵白金', '璀璨钻石', '超凡大师', '最强王者'];
		this.levelName = '';
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
			//初始化昵称输入
			if( $.cookie('chatName') == null ){
				me.cfg.setName.removeClass('hide');
			}else{
			//若cookie昵称存在，隐藏输入昵称框，从cookie中取值
				me.setName();
			}
			//初始化头像
			if( $.cookie('avatar') == null ){
				var avatars = me.randomAvatar[ Math.floor( Math.random()*me.randomAvatar.length ) ];
				$.cookie('avatar', avatars, { expires : 1 });
			}
			me.avatar = $.cookie('avatar');	
			me.cfg.avatar.attr('src', "./styles/images/" + me.avatar);
			//初始化积分
			if( $.cookie('levelScore') == null ){
				$.cookie('levelScore', 0, { expires : 365 });
			}
			var score = parseInt($.cookie('levelScore')) + 2;
			$.cookie('levelScore', score, { expires : 365 });
			me.setScore(score);
			//初始化背景图片
			if( $.cookie('bg') != null ){
				$('body').css({'background':'url(../expression/bg/'+$.cookie('bg')+')', 'background-size':'100% 100%'});
			}
			me.bind();
		},
		setName : function(){
			var me = this;
			me.cfg.setName.addClass('hide');
			me.arrName = $.cookie('chatName');
			var area = remote_ip_info.province + "·" + remote_ip_info.city;
			me.cfg.chatName.html(me.arrName);
			me.cfg.address.html(area);
			// 将昵称发送回服务器
			me.socket.emit('login', { name : me.arrName, address : area });
		},
		setScore : function(score){
			var me = this;
			if( score < 50 )
				me.levelName = me.level[0];
			else if( score < 100 )
				me.levelName = me.level[1];
			else if( score < 200 )
				me.levelName = me.level[2];
			else if( score < 300 )
				me.levelName = me.level[3];
			else if( score < 400 )
				me.levelName = me.level[4];
			else if( score < 500 )
				me.levelName = me.level[5];
			else 
				me.levelName = me.level[6];
			me.cfg.level.html(me.levelName);
		},
		replaceExpress : function(msg){
			// var r = new RegExp('\[\d+\.gif\]', 'g');
			var reg = /\[\d+\.gif\]/g;
			var result, str;
			// console.log(c);
			// var str = msg.replace(r, '<img src="./expression/QQexpression/'+i+'.gif" alt="'+i+'.gif" align="center"/>');
			while( result = reg.exec(msg) ){
				msg = msg.replace(result[0], '<img class="expre" src="./expression/QQexpression/'+result[0].substr(1, (result[0].length-2) )+'" alt="qq表情" align="center"/>');
			}
			return msg;
		},
		displayMsg : function(user, name, avatar, msg, time){
			var me = this;
			//替换表情
			msg = me.replaceExpress(msg)
			var area = remote_ip_info.province + "·" + remote_ip_info.city;
			var str = '<li class="'+user+'">'+
				'<p class="name cl">'+
				'<img src="./styles/images/'+avatar+'" alt="" width="40px" height="40px" align="center">'+
				'<span>['+area+'] ['+me.levelName+'] '+name+'</span>'+
				'<span>'+time+'</span></p>'+
				'<div class="content">'+msg+'</div></li>';
			me.cfg.panel.append(str);
			me.cfg.panel.animate({ scrollTop : me.cfg.panel[0].scrollHeight }, 500);
		},
		check : function(name){
			if( name.trim().length >= 3 && name.trim().length <= 12)
				return true;
			else
				return false;
		},
		bind : function(){
			var me = this;
			// 设置昵称加入聊天
			me.cfg.set.click(function(event) {
				if( me.check(me.cfg.inputName.val()) ){
				//昵称合法
				// 写入cookie后，发送服务器
					var name = me.cfg.inputName.val();			
					$.cookie('chatName', name, { expires : 365 });
					me.setName();
				}else{
					alert("昵称不合法哟！");
					me.cfg.inputName.val('');
					me.cfg.inputName.focus();
				}
			});

			// 匿名加入
			me.cfg.close.click(function(event) {
				// 随机昵称
				var i = Math.ceil( Math.random()*10000 );
				var name = "网友" + i;
				$.cookie('chatName', name, { expires : 365 });
				me.setName();
			});

			// 系统消息
			me.socket.on('system', function(name, userArr, type){
				var msg = name + ( type == 'login' ? "加入" : "离开" ) + "了会话";
				var str = '<li class="alertMsg"><p>'+msg+'</p></li>';
				me.cfg.panel.append(str);
				me.cfg.panel.animate({ scrollTop : me.cfg.panel[0].scrollHeight }, 500);
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
				$('body').keyup(function(event) {
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
				// 组合拼上颜色
				var color = me.cfg.colorBox.val();
				msg = "<div style='color:"+color+";'>" + msg + "</div>";

				var time = (new Date()).toTimeString().substr(0, 8);
				me.cfg.content.val('');
				//将消息显示在自己的消息框内
				me.displayMsg('me', me.arrName, me.avatar, msg, time);
				//将消息发送给服务器
				me.socket.emit('postMsg', me.arrName, msg, me.avatar, time);
			});

			// 点击添加表情
			me.cfg.addLook.click(function(event) {
				if( me.cfg.expreBox.hasClass('hide') ){
					var expressionNum = 132;
					var str = '';
					for(var i = 1; i<= expressionNum; i++){
						str += '<img src="./expression/QQexpression/'+i+'.gif" alt="'+i+'.gif" align="center"/>';
					}
					me.cfg.expreBox.html(str);
					me.cfg.expreBox.removeClass('hide');
				}else{
					me.cfg.expreBox.addClass('hide');
				}
				event.stopPropagation();
			});

			//点击表情
			me.cfg.expreBox.delegate('img', 'click', function(event){
				var str = $(this).attr('alt');
				me.cfg.content.val( me.cfg.content.val() +'['+str+']' );
				$(this).parent().addClass('hide');
				me.cfg.content.focus();
				event.stopPropagation();
			});
			$(document).click(function(event) {
				me.cfg.expreBox.addClass('hide');
				me.cfg.bgBox.addClass('hide');
			});

			//切换背景
			me.cfg.changebg.click(function(event) {
				if( me.cfg.bgBox.hasClass('hide') ){
					var bgNum = 5;
					var str = '';
					for(var i = 0; i<= bgNum; i++){
						str += '<img src="./expression/bg/'+i+'_thumb.jpg" alt="'+i+'.jpg" align="center" width="100px" height="56px"/>';
					}
					me.cfg.bgBox.html(str);
					me.cfg.bgBox.removeClass('hide');
				}else{
					me.cfg.bgBox.addClass('hide');
				}
				event.stopPropagation();
			});

			// 背景图片点击
			me.cfg.bgBox.delegate('img', 'click', function(event){
				var bg = $(this).attr('alt');
				$(this).parent().addClass('hide');

				if( bg.substr(0,1) != '0' ){
					// 添加遮罩
					me.cfg.mask.html('<p>明明君正在切换背景图片...</p>').removeClass('hide');
					var img = new Image();
					img.src = './expression/bg/'+bg;
					img.onload = function(){
						me.cfg.mask.addClass('hide');
					}
					// 写入cookie
					$.cookie('bg', bg, { expires : 365 });
					$('body').css({'background':'url(../expression/bg/'+bg+')', 'background-size':'100% 100%'});
				}else{
					$('body').css('background','#eee');
					$.cookie('bg', null);
				}
				event.stopPropagation();
			})

			// 文字颜色
			me.cfg.wordColor.click(function(event) {
				me.cfg.colorBox.click();
			});
		}
	}

	new Chat({
		mask : 		$('.mask'),
		chatName :  $('.chatName'),
		address :   $('.address'),
		panel :     $('.msglist'),
		onlineNum : $('.onlineNum'),
		onlist : 	$('.onlist'),
		send : 		$('.send'),
		content : 	$('#chat-content'),
		avatar : 	$('#avatar'),
		level : 	$('.level'),
		set : 		$('.set'),
		close : 	$('.close'),
		inputName : $('.inputName'),
		setName :   $('.setName'),
		addLook :   $('.addLook'),
		expreBox :  $('.expressionBox'),
		wordColor : $('.changeWordColor'),
		colorBox :  $('.colorBox'),
		changebg :  $('.changebg'),
		bgBox : 	$('.bgBox')
	});
});