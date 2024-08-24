use log::info;
use seajob_client::login;

#[tokio::test]
async fn test_check_auth() {
    let result = login::check_auth("wt2=DvCrIaGRPHCFSd8d6QCi_wsfva3TkAbVjGeWuiwx4yDgJRBbdNYApuJ-g-XamAvuEdmq0iUgVGjrPHpGjVj3Hng~~").await;
    info!("111 {}", result.unwrap())
}