use std::ffi::CStr;
use std::ffi::CString;
use std::os::raw::c_char;

#[no_mangle]
pub unsafe extern "C" fn main(s: *const c_char) -> *const c_char { 
    let r_str = CStr::from_ptr(s).to_str().unwrap();

    println!("plugin load: {}", r_str);
    let c_str = format!("plugin return {}",r_str);

    CString::new(c_str).expect("CString failed").into_raw()
}
