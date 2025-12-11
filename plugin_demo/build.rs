fn main() {
    let mut config = prost_build::Config::new();
        config.type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]");
        config.out_dir("src");
    let _ = config.compile_protos(&["../protos/plug.proto",], &["../protos/"]); //nps
}




