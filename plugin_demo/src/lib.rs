
use std::ffi::{CStr,CString};
use std::os::raw::c_char;


#[no_mangle]
pub unsafe extern "C" fn plugmain(
    cargs: *const c_char,
) -> *const c_char {
    #[cfg(debug_assertions)]{
        tracing_subscriber::fmt::init();
    }

    let args = CStr::from_ptr(cargs).to_string_lossy().to_string();
    
    println!("{:?}", args);

    CString::new("").expect("CString failed").into_raw()
}
