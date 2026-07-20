import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "@/components/ui/Select";

const options = [
  { value: "", label: "All" },
  { value: "a1", label: "Support Copilot" },
  { value: "a2", label: "SQL Analyst" },
];

describe("Select", () => {
  test("shows the label and selected option", () => {
    render(<Select label="Agent" value="a1" options={options} onChange={vi.fn()} />);
    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.getByText("Support Copilot")).toBeInTheDocument();
  });

  test("opens on click and selecting an option fires onChange and closes", async () => {
    const onChange = vi.fn();
    render(<Select label="Agent" value="" options={options} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /Agent/ }));
    await userEvent.click(screen.getByRole("button", { name: "SQL Analyst" }));

    expect(onChange).toHaveBeenCalledWith("a2");
    // list closed → the non-selected option is no longer in the DOM
    expect(screen.queryByRole("button", { name: "Support Copilot" })).not.toBeInTheDocument();
  });

  test("closes on outside click without firing onChange", async () => {
    const onChange = vi.fn();
    render(
      <div>
        <Select label="Agent" value="" options={options} onChange={onChange} />
        <button type="button">outside</button>
      </div>,
    );

    await userEvent.click(screen.getByRole("button", { name: /Agent/ }));
    expect(screen.getByRole("button", { name: "SQL Analyst" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("button", { name: "SQL Analyst" })).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  test("does not open when disabled", async () => {
    render(<Select label="Version" value="" options={options} onChange={vi.fn()} disabled />);
    await userEvent.click(screen.getByRole("button", { name: /Version/ }));
    expect(screen.queryByRole("button", { name: "SQL Analyst" })).not.toBeInTheDocument();
  });
});
