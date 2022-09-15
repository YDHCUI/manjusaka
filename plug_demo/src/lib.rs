use std::ffi::CStr;
use std::ffi::CString;
use std::os::raw::c_char;

use protobuf::Message;
use protobuf::RepeatedField;

#[no_mangle]
pub unsafe extern "C" fn plugmain(s: *const c_char) -> *const c_char { 
    let r_str = CStr::from_ptr(s).to_str().unwrap();

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
