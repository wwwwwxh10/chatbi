import { Modal } from 'antd'

export function confirmDelete({ title, description, onOk }: { title: string; description?: string; onOk: () => void | Promise<void> }) {
  window.setTimeout(() => {
    Modal.confirm({
      title: (
        <div style={{ paddingRight: 28, fontWeight: 800, fontSize: 18, lineHeight: 1.35 }}>
          {title}
        </div>
      ),
      width: 360,
      className: 'deleteConfirmModal',
      content: String(description ?? '删除后不可恢复，请确认操作。'),
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk,
      centered: true,
      zIndex: 20000,
      getContainer: () => document.body,
    })
  }, 0)
}
