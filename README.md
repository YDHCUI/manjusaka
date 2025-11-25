
# 免责声明 
本工具仅面向合法授权的企业安全建设行为，如您需要测试本工具的可用性，请自行搭建靶机环境。

在使用本工具进行检测时，您应确保该行为符合当地的法律法规，并且已经取得了足够的授权。请勿对非授权目标进行扫描。

此工具仅限于安全研究和教学，用户承担因使用此工具而导致的所有法律和相关责任！ 作者不承担任何法律和相关责任！

如您在使用本工具的过程中存在任何非法行为，您需自行承担相应后果，我们将不承担任何法律及连带责任。



# manjusaka
牛屎花  一款基于rust开发的远程主机管理系统


## 使用方法

![](https://github.com/YDHCUI/manjusaka/blob/main/images/1.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/2.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/3.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/4.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/5.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/6.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/7.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/8.png)



## 更新

### v1.0
1、完全使用rust重构、支持tcp，分段加载，交互shell

### v0.9

2、去除了npc获取公网地址项。。。(容易报毒)。

3、支持socks5代理上线，修改加密算法为aes。 修改npu推送间隔为60s。  

4、修复npc列表界面位移，支持备注功能。 

5、去除了没啥卵用的功能，修复其它bug。


### v0.8 
1、获取真实公网地址、并展示IP归属 , 密码加密，上线提醒功能 

2、支持cdn上线，加入代理上线功能 修复host头问题

3、默认获取所有历史npc上线列表

4、修复其它bug
 

### v0.7
1、新增shellcode加载方式，新增系统位数区分

2、去除nps db的agents表, 使用内存记录npc列表 将进程名称改为进程全路径

3、优化npu推送模式, 修复大量npc时的npu卡顿问题 

4、新增进程注入命令 简单实现 CopySelf

5、配置文件加密，配置分阶段加载。

6、去除了没啥用的功能


### v0.6
1、插件支持可执行文件

2、修复文件上传跨域bug

3、登录验证码，cookie时效机制

4、修复sh 执行命令不能加参数的bug 

5、优化npc体积 

6、更新kzta 系统密码读取插件，更新qvte键盘记录插件 


### v0.5
1、修复安全漏洞

2、开放NPC配置修改功能

3、上传文件流程优化

4、增加动态插件功能，可拓展更多功能 

5、去除特征、修复bug  


### v0.4
1、随机key 

2、去除特征、修复bug 

### v0.3
1、实现截屏、密码获取功能。(仅window) 

2、修复cmd界面不能黏贴的bug。 

3、修复项目不能暂停的bug。 

4、自动创建data文件夹。 


### v0.2
1、修改网络协议使流量加密。

2、加入本地文件上传下载功能。

3、修复shell界面位移bug。

### v0.1
1、实现基础远控功能。



## 体验地址
    

## 交流

加V 

![a8e5625b211ad3b3c435e9403ebae9f](https://github.com/YDHCUI/buut/assets/46884495/6c667bb1-7eae-464f-afbd-3f0d67cbcbcb)
