#[cfg(test)]
mod tests {
    use seajob_client::flow::{Flow, FlowStepTask, TaskResult};

    // 引入所有在模块中的项目，包括类型和特性
    use super::*;
    use seajob_client::flow::FlowInitial; // 确保导入了 FlowInitial 特性

    #[test]
    fn test_from_toml() {
        let toml_content = r#"
        [workflow]
        name = "Test Workflow"
        fisrt_step = "Step1"
        last_step = "Step2"

        [[steps]]
        name = "Step1"
        action = "action1"
        next_steps.condition1 = "Step2"

        [[steps]]
        name = "Step2"
        action = "action2"
        next_steps.condition2 = "End"
        "#;
        let flow = Flow::<String>::from_toml_string(toml_content);
        assert_eq!(flow.name, "Test Workflow");
        assert_eq!(flow.fisrt_step, "Step1");
        assert_eq!(flow.current_step, "Step1");
    }

    // 定义一个已经声明的函数
    fn process_step(input: TaskResult<String>) -> TaskResult<String> {
        match input {
            TaskResult::Success(data) => TaskResult::Success(format!("Processed: {}", data)),
            _ => TaskResult::Failure("No data".into()),
        }
    }

    #[test]
    fn test_impl_step() {
        // 创建一个空的 Flow 实例
        let mut flow = Flow::<String>::default();
        
        // 定义并实现一个步骤 "Step1"
        flow.steps_impl.insert("Step1".to_string(), 
        FlowStepTask::new("asd".to_string(), Box::new(process_step)));

        // 验证步骤是否已成功插入到 steps_impl 中
        assert!(flow.steps_impl.contains_key("Step1"));
    }
}