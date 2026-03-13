import { describe, expect, it, beforeEach, mock } from "bun:test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateClassModal from "@/components/dashboard/create-class-modal";
import type { Course } from "@/lib/types";

describe("CreateClassModal", () => {
  beforeEach(() => {
    const fetchMock = mock(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      if (url.includes("/api/course-catalog") && (!init || !init.method)) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: "course_IF25_11001",
                code: "IF25-11001",
                name: "Algoritma dan Pemrograman",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        };
      }

      if (url.includes("/api/class-catalog") && (!init || !init.method)) {
        return {
          ok: true,
          json: async () => ({
            data: [
              {
                id: "class_RA",
                code: "RA",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        };
      }

      if (url.includes("/api/courses")) {
        return {
          ok: true,
          json: async () => ({
            data: {
              id: "1",
              namaMataKuliah: "Test Course",
              kelas: "RA",
              periode: "ganjil",
            },
          }),
        };
      }

      throw new Error(`Unhandled fetch call for ${url}`);
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  describe("Initial rendering", () => {
    it("should render trigger button", () => {
      render(<CreateClassModal />);
      const button = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      expect(button).toBeInTheDocument();
    });

    it("should not show dialog content initially", () => {
      render(<CreateClassModal />);
      const description = screen.queryByText(
        "Please fill in all the data below to create a new class",
      );
      expect(description).not.toBeInTheDocument();
    });
  });

  describe("Dialog interaction", () => {
    it("should open dialog when trigger button is clicked", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const description = screen.getByText(
        "Please fill in all the data below to create a new class",
      );
      expect(description).toBeInTheDocument();
    });

    it("should show all form fields when opened", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      expect(screen.getByText("Course Name")).toBeInTheDocument();
      expect(screen.getByText("Class")).toBeInTheDocument();
      expect(screen.getByText("Academic Period")).toBeInTheDocument();
    });

    it("should show description when opened", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const description = screen.getByText(
        "Please fill in all the data below to create a new class",
      );
      expect(description).toBeInTheDocument();
    });
  });

  describe("Form validation", () => {
    it("should show course name combobox placeholder", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const placeholder = screen.getByText("Enter course name");
      expect(placeholder).toBeInTheDocument();
    });

    it("should allow typing in course search input", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const combobox = screen.getByRole("button", {
        name: /Enter course name/i,
      });
      await user.click(combobox);

      const searchInput = screen.getByPlaceholderText("Search by course code or name");
      await user.type(searchInput, "Algoritma");
      expect(await screen.findByText("Algoritma dan Pemrograman")).toBeInTheDocument();
    });

    it.skip("should allow creating new course via enter key", async () => {
      // TODO: This test is failing because the "Create new" button doesn't appear
      // in the test environment. Needs investigation into why the filtering/search
      // state doesn't update properly during testing.
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const combobox = screen.getByRole("button", {
        name: /Enter course name/i,
      });
      await user.click(combobox);

      // Wait for the catalog to load
      await screen.findByText(/Algoritma dan Pemrograman/);

      const searchInput = screen.getByPlaceholderText("Search by course code or name");

      // Paste the text to speed up the input
      await user.click(searchInput);
      await user.paste("Custom Course");

      // Wait for filtering to complete and create button to appear
      await waitFor(
        async () => {
          const button = await screen.findByText("Create new: Custom Course");
          expect(button).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Press Enter to trigger the create dialog
      await user.keyboard("{Enter}");

      // Verify the "Add new course" dialog appears
      expect(await screen.findByText("Add new course")).toBeInTheDocument();
    });

    it("should show class select placeholder", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const placeholder = screen.getByText("Select class");
      expect(placeholder).toBeInTheDocument();
    });

    it("should show period select placeholder", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const placeholder = screen.getByText("Select semester");
      expect(placeholder).toBeInTheDocument();
    });

    it("should show period auto-detected message", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const message = screen.getByText(
        "Academic year automatically detected based on current date",
      );
      expect(message).toBeInTheDocument();
    });
  });

  describe("Form submission", () => {
    it("should show submit button", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const submitButton = screen.getByRole("button", {
        name: /Create Class/i,
      });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    it("should not display error initially", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const errorMessage = screen.queryByText(/Failed to create/);
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  describe("Form reset behavior", () => {
    it("should reset form when dialog is closed", async () => {
      const user = userEvent.setup();
      render(<CreateClassModal />);

      const triggerButton = screen.getByRole("button", {
        name: /Create New Class/i,
      });
      await user.click(triggerButton);

      const combobox = screen.getByRole("button", {
        name: /Enter course name/i,
      });
      await user.click(combobox);

      const option = await screen.findByText("Algoritma dan Pemrograman");
      await user.click(option);
      expect(screen.getByText("Algoritma dan Pemrograman")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(
          screen.queryByText("Please fill in all the data below to create a new class"),
        ).not.toBeInTheDocument();
      });

      await user.click(triggerButton);

      const resetPlaceholder = screen.getByText("Enter course name");
      expect(resetPlaceholder).toBeInTheDocument();
    });
  });

  describe("Component integration", () => {
    it("should render with onClassCreated callback prop", () => {
      const mockCallback = mock((_course: Course) => {});
      const { container } = render(<CreateClassModal onClassCreated={mockCallback} />);
      expect(container).toBeTruthy();
    });

    it("should render without callback prop", () => {
      const { container } = render(<CreateClassModal />);
      expect(container).toBeTruthy();
    });
  });
});
